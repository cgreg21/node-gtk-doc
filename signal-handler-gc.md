# Gestionnaires de signal et collecte de mémoire

Ce document explique comment node-gtk maintient les fonctions de gestionnaire de signal vivantes
exactement aussi longtemps qu'elles sont nécessaires, pourquoi les approches évidentes provoquent des fuites ou des plantages,
et le design que nous avons retenu. Il s'agit du compte rendu de l'investigation qui a mené à
[#375](https://github.com/romgrk/node-gtk/pull/375).

## Le bug : fuite par boucle de références

Connecter un gestionnaire qui capture l'objet auquel il est connecté est l'usage le plus naturel du monde :

```js
const button = new Gtk.Button()
button.on('clicked', () => button.set_label('clicked'))
```

Avant la correction, cet extrait **fuyait le bouton pour toujours**, même après que toutes les références JavaScript vers lui aient été supprimées. La raison en est un cycle de références qui traverse les tas C++ et JS :

```
Closure (C++) ──strong Nan::Persistent──▶ handler fn ──closes over──▶ JS wrapper
   ▲                                                                      │
   └──────────────── GObject ◀── toggle ref ── (qdata) ◀─────────────────┘
        is owned by (g_signal_connect_closure)
```

- Le `Closure` stockait le gestionnaire dans un `Nan::Persistent<Function>`, qui est une
  **racine forte du GC**.
- Cela maintient le gestionnaire en vie, qui capture le wrapper JS, lui-même conservé en vie par la référence bascule sur le `GObject`, que le `Closure` appartient.

Aucune référence extérieure au cycle ne le référence, mais le `Persistent` est lui-même une racine,
si bien que V8 ne peut jamais collecter quoi que ce soit de cela. `Closure::Invalidated` ne se déclenche que lorsque le
`GObject` est finalisé, ce qui n'arrive jamais tant que le cycle le maintient. La même boucle fuit aussi un niveau plus profond avec `Gtk.EventController` et `Gtk.Gesture` (un gestionnaire sur un contrôleur qui capture le contrôleur ou son widget).

Tests de régression : `tests/object__closure_refloop_gc.js` et
`tests/object__event_controller_refloop_gc.js` (basés sur FinalizationRegistry ; elles collectent `0/N` avant la correction et `N/N` après).

## Pourquoi c'est difficile dans un addon Node

Le cycle traverse la frontière C++/JS, donc ni le collecteur V8 ni un `delete` C++ ne peuvent voir l'ensemble. Il n'y a que trois vraies issues :

1. **GC cyclique inter-heap.** PyGObject résout le même problème parce que le collecteur CPython fait des collections cycliques à travers la frontière C/Python : les extensions implémentent `tp_traverse`/`tp_clear` et participent à la détection de cycles. **V8 n'a pas d'équivalent pour les objets C++ arbitraires** — le seul mécanisme est cppgc (le "heap unifié" / Oilpan de V8). C'est la voie suivie par #375 à l'origine ; voir ci-dessous pourquoi nous l'avons abandonnée (un crash inexpliqué dans l'intégration node-gtk sur arm64 macOS).
2. **Garder le gestionnaire dans le heap JS**, accessible uniquement via le graphe objet JS du wrapper,
   de sorte que le collecteur normal de V8 récupère le cycle wrapper↔gestionnaire lorsque le wrapper devient inaccessible.
   C'est la voie que nous avons choisie (voir "La correction").
3. **Laisser le charge à l'utilisateur** — conserver le gestionnaire via une référence forte et exiger une déconnexion manuelle. C'est ce que fait NodeGui : il stocke une forte référence au callback JS d'émission côté C++ et documente qu'il faut `removeEventListener` sinon on fuit. Nous considérons cela strictement pire que (2).

### Node-addon-api aide-t-il ? Non.

Une supposition raisonnable est que le passage de Nan vers **node-addon-api / Node-API** aiderait. Ce n'est pas le cas. Node-API est une ABI C stable pour références, encapsulation d'objets et finaliseurs, mais il n'a **aucune primitive pour tracer cette référence depuis C++**. Ses références sont soit *fortes* (`napi_ref` avec compteur de références — racine GC, exactement comme `Nan::Persistent`, même fuite) soit *faibles* (ne maintient pas le callback vivant du tout). Il n'y a pas d'intégration de suivi / heap unifié. Passer à node-addon-api ne ferait que "éviter cppgc" au sens trivial de ne jamais l'appeler — vous auriez toujours à casser le cycle avec l'approche (2). C'est la même correction avec une API différente.

## Ce que nous avons essayé en premier : cppgc (et pourquoi nous avons reculé)

#375 suivait l'esprit de PyGObject avec cppgc : stocker le gestionnaire dans une
`v8::TracedReference` (que V8 maintient vivante uniquement pendant qu'elle est *tracée*) et attacher un objet "tracer" `GarbageCollected` cppgc à chaque wrapper qui trace les fermetures surveillées. Quand le wrapper devient inaccessible, le tracer n'est plus tracé, le gestionnaire est collecté et le cycle est rompu. Cela fonctionne sur **Linux et Windows**.

Dans node-gtk, cela **crash sur arm64 macOS**, au tout premier
appel `cppgc::MakeGarbageCollected<…>()` dans `AssociateGObject` :

```
EXC_BAD_ACCESS (address=0x8)
frame #0  node`cppgc::…::MakeGarbageCollectedTraitInternal::Allocate(AllocationHandle&, size, index) + 52
frame #1  node_gtk.node`…AllocationDispatcher<ClosureTracer,…>::Invoke(handle, size=88)
frame #5  node_gtk.node`GNodeJS::AssociateGObject(...)
```

L'investigation a éliminé les suspects évidents : ce n'est **pas** un problème ABI/define cppgc (`nm` montre que le V8 de Node est construit *uncaged* sur chaque plateforme,
ainsi l'addon correspond déjà ; ajouter `CPPGC_CAGED_HEAP` et compagnons n'a fait qu'empirer), et **pas** un problème de symboles manquants (l'addon importe
`Isolate::GetCppHeap`, `CppHeap::GetAllocationHandle`, `EnsureGCInfoIndex…`,
`Allocate`, `SetCppgcReference`, et le binaire macOS de Node exporte tout cela).

**Important, ce n'est pas une limitation générale node/cppgc.** Un addon minimal node-gyp qui fait exactement la même chose — `isolate->GetCppHeap()->GetAllocationHandle()` puis `cppgc::MakeGarbageCollected<T>()`, y compris un `T` finalizable (mutex + vecteur + destructeur, même forme de ~88 octets que `ClosureTracer`) et les cflags macOS `pkg-config` de node-gtk — **compile et s'exécute correctement sur le runner arm64 macOS GitHub**. Donc l'allocation cppgc embarquée *fonctionne* bien pour les addons là-bas ; le crash est déclenché par quelque chose de spécifique à l'intégration beaucoup plus large de node-gtk (ses nombreux fichiers de traduction / includes / NAN / le contexte dans lequel `AssociateGObject` s'exécute) que nous n'avons pas pu isoler.

Plutôt que de livrer un bug héisenberg spécifique à une plateforme que nous ne pouvions pas expliquer, nous avons choisi la conception plus simple et sans cppgc ci-dessous. Elle supprime complètement la question : pas de cppgc, pas de `TracedReference`, rien de spécifique à la plateforme. Si cppgc est un jour revisité, le crash arm64-macOS inexpliqué dans l'intégration node-gtk doit être résolu d'abord.

## La correction : garder les gestionnaires dans le heap JS

Nous cassons le cycle sans cppgc en rendant le gestionnaire accessible **uniquement via le graphe objet JS propre au wrapper**, de sorte que le collecteur normal de V8 récupère le cycle wrapper↔gestionnaire une fois le wrapper inaccessible.

- Chaque wrapper stocke ses gestionnaires connectés dans un simple `Array` JS, maintenu sur l'objet wrapper lui-même via un symbole privé (donc invisible au code utilisateur et vivant/mort avec le wrapper).
- Un `Closure` ne conserve plus un `Nan::Persistent<Function>`. Il stocke seulement l'**index** du gestionnaire dans ce tableau — un entier n'est pas une racine GC.
- Au moment de l'émission, `Closure::Marshal` prend l'instance `GObject` depuis
  `param_values[0]`, trouve son wrapper (`qdata → GObjectWrapper → persistent → objet JS`), lit `handlers[index]` et l'appelle. Si le wrapper a déjà été collecté (objet supprimé du JS), le gestionnaire n'est simplement pas appelé — même sémantique que la voie faible de la référence bascule ailleurs.

Le seul élément qui maintient un gestionnaire vivant est désormais le tableau du wrapper, et le bord `handler → wrapper` est une référence JS normale. Tout le graphe est en JS simple,
si bien que lorsque le wrapper devient inaccessible, V8 collecte le tableau, les gestionnaires et le wrapper ensemble ; la destruction existante via toggle-ref/idle de node-gtk supprime ensuite le `GObject`. Le résultat est exactement ce que #375 visait (un gestionnaire meurt avec son objet), obtenu de manière portable — ça fonctionne sur toutes les plateformes, y compris arm64 macOS, et ne nécessite ni cppgc, ni `TracedReference`, ni adaptation de configuration de build.

Il existe un seul objet de durée de vie C++ par wrapper — le `GObjectWrapper` existant stocké dans qdata. Le tableau des gestionnaires vit en JS, donc rien de nouveau n'est introduit côté C++.

### Compromis

- **Les gestionnaires déconnectés restent jusqu'à la collecte de l'objet.** La déconnexion invalide le `Closure` (donc le gestionnaire n'est plus *appelé*), mais la correction ne revient pas volontairement dans le `GObject` depuis `Closure::Invalidated` pour effacer la case du tableau — toucher un `GObject` lors de son propre nettoyage est dangereux (voir les notes de dispose-during-GC dans l'historique git). Le tableau des gestionnaires grossit donc d'une entrée par `connect` et n'est récupéré que lorsque le wrapper l'est. C'est borné par la durée de vie de l'objet — l'objet reste entièrement collectable — donc ce n'est pas une vraie fuite, seulement de la mémoire conservée tant que l'objet est vivant. Le cas visible est la forte activité de connect/disconnect sur un objet long vécu ; on y reviendra avec un handle faible côté wrapper si ça finit par compter.
- La recherche du gestionnaire au moment de l'émission nécessite quelques déréférencements de pointeur plus une lecture de propriété privée, contre le précédent `Persistent` direct. L'émission de signal passe déjà dans JS, donc c'est négligeable.
