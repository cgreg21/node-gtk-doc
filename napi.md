# Évaluation : migration de Nan vers N-API (Node-API)

Ce document consigne une évaluation (juillet 2026, contre Node 26.4.0) pour déterminer si
node-gtk pouvait abandonner [Nan](https://github.com/nodejs/nan) au profit de
[N-API](https://nodejs.org/api/n-api.html). En bref : **c'est faisable** — les deux blocages soupçonnés se sont révélés portables — mais c'est une grosse migration mécanique (~15k LOC, 47 fichiers) pour un gain mince, donc elle n'est pas actuellement prévue. Les résultats ci-dessous sont conservés pour éviter de refaire l'analyse complète si le tumulte V8/Nan oblige un jour à reposer la question.

## Ce que nous gagnerions, et pourquoi c'est mince

L'avantage phare de N-API est la stabilité ABI : un binaire par plateforme pour toutes les versions de Node, sans recompilation par ABI. Mais node-gtk est lié à
`gobject-introspection` et `cairo`, donc il a besoin de prebuilds par plateforme de toute façon. Le gain ne se réduirait qu'à la dimension `node_abi` de la matrice de prebuild — réel, mais modeste.

Pendant ce temps, la vraie douleur récurrente — le changement constant de l'API V8 (V8 14 avec `HolderV2`, `GetPrototypeV2`, changements de l'API des champs internes) — est aujourd'hui largement absorbée par Nan : la migration vers Node 26 (#474) a abouti à un CI vert avec des correctifs modestes au niveau de Nan. Nan est toutefois en mode maintenance, donc ce calcul peut changer.

## Blocage suspect 1 : l'intercepteur des propriétés nommées — *pas un blocage*

`GObjectFallbackPropertyGetter/Setter` (`src/gobject.cc`) est un intercepteur V8
`NamedPropertyHandlerConfiguration` (`kNonMasking`), et N-API n'a aucune API d'intercepteur (demande ouverte de longue date sur `node-addon-api`; le
`v8::ObjectTemplate` n'est explicitement jamais exposé).

Mais node-gtk s'appuie peu dessus. Les accesseurs par propriété sont déjà le mécanisme principal : `lib/bootstrap.js` énumère chaque propriété introspectée (`makeObject` → `addProperty`) et installe des getters/setters JS simples qui appellent `internal.ObjectPropertyGetter/Setter` — des méthodes natives ordinaires, complètement compatibles avec N-API. L'intercepteur C++ n'est qu'un *fallback* ; en pratique, il ne charge que pour les GTypes privés/non introspectables (la famille #441), où `makeObject()` ne s'exécute jamais.

Stratégie de portage : quand `GetClassTemplate` construit une classe pour un type sans information GI, énumérez ses propriétés avec `g_object_class_list_properties()` (API GObject standard, sans typelibs) et définissez ensuite des accesseurs par propriété. Ce qui est perdu, c'est seulement les propriétés ajoutées *après* `class_init` à l'exécution — quasiment inexistantes en pratique.

Dernier point à régler : les intercepteurs indexés cairo `Glyph`/`TextCluster` (`Nan::SetIndexedPropertyHandler`) n'ont pas d'équivalent par index ; ils deviendraient des tableaux réels ou des méthodes d'accès.

## Blocage suspect 2 : la machinerie de durée de vie par toggle-ref — *pas un blocage non plus*

C'était la pièce jugée la plus difficile : `ToggleNotify` (`src/gobject.cc`) bascule le wrapper entre faible et fort selon la refcount du `GObject` (1↔2), y compris *la revivification* d'un wrapper faible quand GTK prend possession de l'objet, avec un callback faible en deux passes dont la première se déclenche au milieu d'un GC. L'idée a été que les finaliseurs N-API (après le GC, sans résurrection) ne pouvaient pas exprimer cela. La lecture de l'implémentation de Node et des tests empiriques l'ont réfuté, allégation par allégation.

### `napi_ref` *est* la danse du toggle

À partir de `node/src/js_native_api_v8.cc` (`Reference::Ref`/`Unref`) :

```cpp
uint32_t Reference::Ref() {
  if (persistent_.IsEmpty()) return 0;
  if (++refcount_ == 1 && can_be_weak_) persistent_.ClearWeak();  // = notre toggle-up
  ...
uint32_t Reference::Unref() {
  ...
  if (--refcount_ == 0) SetWeak();                                 // = notre toggle-down
```

`napi_reference_ref/unref` effectuent littéralement les mêmes appels `ClearWeak`/`SetWeak` que `ToggleNotify` construit à la main. Le mapping :

| node-gtk aujourd'hui (Nan/V8)                    | Équivalent N-API                          |
|--------------------------------------------------|-------------------------------------------|
| toggle-down → `persistent.SetWeak(...)`           | `napi_reference_unref` → 0                 |
| toggle-up → `persistent.ClearWeak()` (revival)    | `napi_reference_ref` → 1                   |
| flag `collected` défini au premier passage        | `napi_get_reference_value()` renvoie NULL  |
| toggle-up sur un wrapper collecté (flags de garde) | `Ref()` sur persistent vide : no-op sûr, renvoie 0 |
| nouveau wrapper via `WrapperFromGObject`          | inchangé                                  |

La classe `Reference` de Node porte même un commentaire décrivant exactement la fenêtre "collecté mais finaliseur en attente" que node-gtk protège avec des flags.

### "On ne peut pas ressusciter" est vrai mais sans rapport

V8 ne peut pas non plus ressusciter un handle collecté — c'est pour cela qu'existent le flag `collected` et le chemin "construire un nouveau wrapper". Rien n'est perdu ; le même design se porte inchangé, avec `napi_get_reference_value() == NULL` comme test de collecte (plus simple).

### La discipline en deux passes / au milieu du GC est intégrée

Sur l'API stable, le callback faible de Node réinitialise la persistent lors du premier passage, puis **met en file** le finaliseur utilisateur et la vide via `SetImmediate` au moment de la boucle d'événements (`node_api.cc`, `node_napi_env__::EnqueueFinalizer`). Comparez avec ce que node-gtk a construit manuellement pendant la série de plantages #439 :

| code manuel après 5 bugs sur la durée de vie du wrapper | Chemin stable N-API                     |
|------------------------------------------------------------|----------------------------------------|
| premier passage : seulement basculer le flag + réinitialiser le handle | Node réinitialise la persistent, met le finaliseur en file |
| second passage : pas d'appels JS, report du teardown réel vers `g_idle_add` | finaliseur s'exécute au moment de la boucle, JS est légal |
| discipline "ne jamais appeler `g_object_*` au milieu d'un GC" | aucun code addon ne s'exécute pendant le GC |

Toute la classe de bugs de réentrance pendant le GC (crash de revival de toggle-up, signal émis pendant dispose au milieu du GC, crash `g_object_*` au premier passage — voir `doc/signal-handler-gc.md` pour la saga sœur) ne peut pas se produire, car le code addon n'est jamais exécuté à l'intérieur du GC. Le saut `g_idle_add` serait probablement conservé (les finaliseurs se drainent sur le tick uv ; un idle GLib est un contexte plus sûr sous l'intégration de boucle de node-gtk), mais comme mesure de sécurité, pas comme élément essentiel. Si un timing exact en deux passes devait un jour être nécessaire, les finaliseurs basiques `NAPI_EXPERIMENTAL` + `node_api_post_finalizer` le reproduisent littéralement.

### Confirmation empirique (Node 26.4.0)

Un addon de test (N-API brut, `napi_create_reference` initial count 0 + `napi_add_finalizer`) a confirmé les quatre comportements contestés :

- **Ressuscitation** : objet inaccessible depuis JS, référence faible ; `napi_reference_ref` avant le GC ; deux GCs forcés → l'objet a survécu, le finaliseur n'a jamais été exécuté.
- **Fenêtre collectée** : après le GC, `napi_get_reference_value` renvoie immédiatement NULL, le finaliseur est toujours en attente → la fenêtre est détectable.
- **Toggle-up dans la fenêtre** : `napi_reference_ref` sur la ref collectée → `status=ok, count=0`, sans crash.
- **Arrêt de l'environnement** : un finaliseur sur une ref *forte, toujours vivante* s'est exécuté à la fin du processus.

## Le vrai résidu (les différences qui comptent)

1. **Les finaliseurs s'exécutent à l'arrêt de l'environnement.** V8 n'exécutait jamais les callbacks faibles à la sortie, donc node-gtk n'a aucun code qui teste "drop toggle ref → dispose → signals vers JS" pendant l'arrêt de l'interpréteur. Sous N-API, ce chemin s'exécute pour chaque wrapper vivant à la fin et doit être protégé (ignorer le teardown qui touche JS quand l'environnement est détruit).
2. **Fenêtre collectée plus longue** — les finaliseurs s'exécutent sur le tick immédiat après le GC plutôt qu'au second passage. `WrapperFromGObject` tolère déjà une fenêtre arbitrairement longue (il survit à la déferre `g_idle_add` aujourd'hui).
3. **Boxed utilise deux champs internes** (`src/boxed.cc`: pointeur + `Boxed*`) ; `napi_wrap` fournit un seul slot, donc les deux pointeurs sont empaquetés dans une seule struct. Cela touche `modules/system.cc`, `gi.cc` et le générateur cairo (`generator.js` émet des lectures directes des champs internes).
4. `napi_reference_ref` plante si elle est appelée dans un contexte GC — uniquement accessible avec les finaliseurs basiques expérimentaux ; ce n'est pas un problème sur le chemin stable puisque `ToggleNotify` ne peut plus se déclencher au milieu du GC.

## En résumé

Faisable, mais pas prévu. Le port représente ~15k LOC de conversion surtout mécanique (419 `Nan::New`, 274 `Nan::To`, 232 désemballages `ObjectWrap`, 144 `Persistent`, 112 accès aux champs internes au moment de l'écriture), plus la revalidation du sous-système de durée de vie — qui, paradoxalement, serait la partie *la moins risquée* : la `Reference` de Node encode déjà la machine d'états que node-gtk a mis au point, et le modèle de finaliseur décalé supprime complètement la classe de risque du GC intermédiaire. Le déclencheur pour revisiter la question n'est pas la stabilité ABI, mais l'incapacité de Nan à suivre un changement d'API V8.
