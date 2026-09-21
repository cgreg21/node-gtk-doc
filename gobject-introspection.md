# Le système de types GObject

GTK et les bibliothèques qui l'entourent (GLib, Gio, Adwaita, …) sont construits sur **GObject**,
un système de types qui ajoute les objets, l'héritage, les propriétés et les signaux au C. Ce guide explique
comment ce système se présente en JavaScript afin que vous puissiez lire la documentation C/GI de GTK et la traduire
vers node-gtk par vous-même. Pour savoir ce qu'une fonction *fait*, référez-vous toujours à la documentation de la bibliothèque — node-gtk ne change que *comment* vous l'appelez, jamais *ce qu'elle fait*.

#### Table des matières
  1. [Introduction](#1-introduction)
  2. [GObjects](#2-gobjects)
  3. [Structs et unions](#3-structs-et-unions)
  4. [Primitives](#4-primitives)
  5. [Appels de fonction](#5-appels-de-fonction)
  6. [Pièges courants](#6-pièges-courants)

## 1. Introduction

node-gtk expose GTK via des wrappers générés automatiquement. Le pont est **GObject-Introspection** :
chaque bibliothèque GObject fournit une description machine de son API (un fichier `.typelib`). node-gtk lit cette description et construit,
à la volée, les classes JavaScript, méthodes et constantes correspondantes. C'est pour cette raison que les types
dont vous allez rencontrer ci-dessous correspondent si directement au C.

Deux choses méritent d'être gardées en tête en tant que développeur Node :

- **Vous appelez du vrai code C.** node-gtk convertit les valeurs à travers la frontière (une chaîne JS ↔ un `char *` C), mais la fonction qui s'exécute est celle de la bibliothèque elle-même. Quelques concepts C remontent donc dans l'API, et appeler une fonction de la mauvaise manière peut **faire planter le processus**.
- **La mémoire est gérée pour vous.** En plus du fait qu'elle peut faire planter le processus, vous n'avez pas besoin de vous préoccuper de concepts C comme la gestion de mémoire.

Tout vit sous un **espace de noms** — l'objet que vous importez (`Gtk`, `Gio`,
`GLib`, `Adw`). Au sein d'un espace de noms, vous rencontrez plusieurs types — GObjects, structs,
énumérations, primitives — chacun couvert dans sa propre section ci-dessous. Ils partagent tous un
ensemble de règles de nommage, qu'il vaut mieux apprendre dès le départ.

#### Conventions de nommage

node-gtk normalise les noms du style C vers les conventions JavaScript. La règle directrice : un nom C comme `gtk_widget_set_visible` enlève le préfixe d'espace de noms et est transformé en camelCase pour devenir une méthode, `widget.setVisible(true)`.

| Type | Convention | Exemple |
| --- | --- | --- |
| Fonctions & méthodes | `lowerCamelCase` | `GLib.randomIntRange(0, 100)`, `textBuffer.placeCursor(0)` |
| Fonctions virtuelles remplacées | `virtual_` + `lowerCamelCase` | `virtual_getRequestMode`, `virtual_sizeAllocate` |
| Champs & propriétés | `lowerCamelCase` | `textView.showLineNumbers = true`, `rgba.alpha = 0.5` |
| Structs, unions, GObjects, interfaces | `UpperCamelCase` | `Gtk.Button`, `Gdk.RGBA` |
| Énumérations & flags | `UpperCamelCase` | `Gtk.Orientation.VERTICAL`, `Gtk.Align.FILL` |
| Constantes & valeurs | `SNAKE_CASE` (inchangé) | `Gdk.KEY_g !== Gdk.KEY_G`, `Gtk.STYLE_PROVIDER_PRIORITY_USER` |
| Signaux | `dash-case` | `button.on('clicked', …)` |

## 2. GObjects

Les GObjects sont le cœur de GTK : instances de classes organisées en hiérarchie.
Ils sont créés avec un constructeur ou une fonction de création :

```javascript
// Constructeur avec propriétés initiales
const label = new Gtk.Label({ label: "I'm a label!" })

// Fonction de création
const button = Gtk.Button.newWithLabel('Click me')
```

([`Gtk.Label`](https://docs.gtk.org/gtk4/class.Label.html),
[`Gtk.Button`](https://docs.gtk.org/gtk4/class.Button.html))

Une instance expose chaque méthode de sa classe **et de tous ses parents** — les deux
widgets ci-dessus dérivent de
[`Gtk.Widget`](https://docs.gtk.org/gtk4/class.Widget.html), donc ils partagent sa
API entière. Les méthodes utilisent **lowerCamelCase** et sont appelées sur l'instance :

```javascript
label.setText('Hello')
console.log(label.getText()) // "Hello"
```

node-gtk réécrit chaque fonction C en méthode d'instance : le premier
argument `this` est implicite et le nom est camelCased. Donc cette signature C :

```c
void gtk_label_set_text (GtkLabel *self, const char *str);
```

est appelée comme `label.setText(str)`. Les fonctions avec des *arguments de sortie* les renvoient comme résultat au lieu de les retourner — voir [§5](#5-appels-de-fonction).

#### Propriétés

En plus des méthodes, un GObject expose des **propriétés** — valeurs nommées et typées
comme le texte d'un label ou le titre d'une fenêtre. Vous les avez déjà définies lors de la construction (l'objet passé à `new`) ; vous pouvez aussi les lire et les écrire ensuite, en **lowerCamelCase** :

```javascript
const label = new Gtk.Label({ label: 'Hello' })  // défini à la construction
label.label = 'Goodbye'                           // écriture
console.log(label.label)                          // lecture
```

Les propriétés sont *observables* : un GObject émet un signal `notify::<property>`
chaque fois qu'une propriété change, de sorte que vous pouvez y réagir comme sur n'importe quel autre signal (voir ci-dessous) :

```javascript
label.on('notify::label', () => console.log('label is now', label.label))
```

#### Signaux

Les GObjects émettent des événements appelés **signaux**. En C ils sont connectés avec
[`g_signal_connect`](https://docs.gtk.org/gobject/func.signal_connect.html) ;
node-gtk expose l'API familière `.on` / `.once` / `.off` / `.emit` à la place :

```javascript
const button = Gtk.Button.newWithLabel('Click me')

button.on('clicked', onClicked)            // exécuté à chaque émission
button.once('clicked', onClicked)          // exécuté au plus une fois
button.off('clicked', onClicked)           // déconnecter
button.emit('clicked')                     // émettre manuellement

function onClicked() {
  console.log('clicked!')
}
```

`.on`/`.once` prennent un booléen optionnel `after` en fin pour exécuter le gestionnaire après le gestionnaire par défaut :

```javascript
button.on('clicked', onClicked, /* after */ true)
```

**Note :** l'instance émettrice n'est *pas* transmise au callback (voir
[#21](https://github.com/romgrk/node-gtk/issues/21)). Certains signaux utilisent leur
valeur de retour pour contrôler la propagation ou l'action par défaut (par exemple, retourner `true`
pour arrêter un événement clavier) — vérifiez la documentation du signal. Les versions bas niveau
`.connect(name, callback): number` et `.disconnect(name, handlerId)` sont aussi disponibles mais rarement nécessaires.

#### Héritage

Vous pouvez sous-classer un GObject existant. Enregistrez la sous-classe dans le système de types
pour qu'elle soit entièrement intégrée et puisse remplacer des fonctions virtuelles :

```javascript
class CustomWidget extends Gtk.Widget {
  static GTypeName = 'NodeGTKCustomWidget'
  virtual_snapshot(snapshot) {} // remplace la fonction virtuelle `snapshot`
}
registerClass(CustomWidget)
```

> **Enregistrez avant d'instancier.** `new CustomWidget()` ne fonctionne *qu'après*
> `registerClass(CustomWidget)`. Instancier une sous-classe non enregistrée revient à
> l'ancêtre abstrait et plante le processus.

##### Fonctions virtuelles

Pour remplacer une fonction virtuelle, définissez une méthode nommée **`virtual_`** suivie de la forme camelCase du nom de la vfunc. node-gtk relie celles-ci — et *seulement celles-ci* — dans la vtable GObject :

| Fonction virtuelle (C / GIR) | Méthode à définir |
| -------------------------- | ---------------- |
| `get_request_mode`         | `virtual_getRequestMode` |
| `measure`                  | `virtual_measure` |
| `size_allocate`            | `virtual_sizeAllocate` |
| `snapshot`                 | `virtual_snapshot` |
| `dispose`                  | `virtual_dispose` |

Une méthode simple n'est **jamais** traitée comme une surcharge, donc nommer une méthode `dispose`,
`getProperty` ou `sizeAllocate` ne détourne plus silencieusement la vfunc correspondante.
Le préfixe maintient également la surcharge distincte de la méthode publique du même nom —
`widget.sizeAllocate(rect, baseline)` appelle la méthode, tandis que
`virtual_sizeAllocate` surcharge la vfunc.

Chaînez vers l'implémentation que vous avez remplacée avec `super.virtual_<name>()` :

```javascript
class CustomWidget extends Gtk.Widget {
  static GTypeName = 'NodeGTKCustomWidget'
  virtual_snapshot(snapshot) {
    super.virtual_snapshot(snapshot)   // dessiner le parent d'abord
    /* ...puis dessiner au-dessus... */
  }
}
```

node-gtk enregistre automatiquement les nouvelles sous-classes GObject dans le système de types,
mais vous pouvez aussi utiliser `import { registerClass } from 'node-gtk'` pour enregistrer votre
classe immédiatement.

## 3. Structs et unions

Les structs et unions sont des types *boxés* — de simples conteneurs de données pouvant aussi porter quelques méthodes. Contrairement aux GObjects, elles n'ont pas d'héritage ; considérez-les comme de simples enregistrements.

Créez-en une avec son constructeur, s'il en a un (par ex.
[`Gdk.RGBA`](https://docs.gtk.org/gdk4/struct.RGBA.html)) :

```javascript
const color = new Gdk.RGBA({ red: 0.5, green: 0.5, blue: 0.5, alpha: 1.0 })
```

…ou avec une fonction de création (par ex.
[`Gdk.Cursor`](https://docs.gtk.org/gdk4/class.Cursor.html)) :

```javascript
const cursor = Gdk.Cursor.newFromName('pointer', null)
```

Les champs sont lus et écrits avec la notation pointée, en **lowerCamelCase** :

```javascript
console.log(color.red)
color.alpha = 0.8
```

## 4. Primitives

Les valeurs primitives — entiers, flottants, booléens et chaînes — correspondent directement à JavaScript, sans traitement particulier. (Les chaînes doivent parfois être passées sous forme de tableau d'octets — voir la documentation de la bibliothèque.) Les énumérations et flags, traités ci-dessous, se réduisent aussi à des valeurs simples.

#### Nombres et BigInt

La plupart des entiers et tous les flottants sont des `number` JavaScript simples. L'exception est les entiers **64 bits** (`gint64`/`guint64`) : pour préserver la précision complète, ils traversent la frontière sous forme de **`BigInt`**, de sorte que certaines APIs vous donnent `10n` plutôt que `10`. En entrée, un paramètre qui attend un entier 64 bits accepte les deux formes.

#### Énumérations et flags

Une *énumération* est un ensemble fixe de valeurs nommées ; un type *flags* est une énumération dont les valeurs sont des puissances de deux, conçues pour être combinées en bitmask. Combinez et testez-les avec les opérateurs bitwise de JavaScript, exactement comme en C :

```javascript
// combinaison avec `|`
const flags = Gio.ApplicationFlags.HANDLES_OPEN | Gio.ApplicationFlags.HANDLES_COMMAND_LINE

// test avec `&`
if (flags & Gio.ApplicationFlags.HANDLES_OPEN) { /* … */ }
```

## 5. Appels de fonction

La traduction des appels entre C et JavaScript a quelques pièges, surtout parce que certains concepts C (comme les pointeurs) n'ont pas d'équivalent JavaScript.

#### Arguments de sortie

Les arguments de sortie sont des paramètres qu'une fonction C remplit via un pointeur au lieu de retourner. **Quand vous appelez du C depuis JS**, node-gtk les alloue et les dépile pour vous : vous ne les passez pas, et ils reviennent sous forme de valeurs de retour. Si un appel produit plus d'une valeur (un vrai retour plus un argument de sortie, ou plusieurs arguments de sortie), node-gtk les retourne sous forme de tableau, avec la vraie valeur de retour en premier.

**Quand C appelle votre JS** — par exemple lors de la surcharge de la fonction virtuelle
[`measure`](https://docs.gtk.org/gtk4/vfunc.Widget.measure.html) (`virtual_measure`) — la direction s'inverse : votre fonction doit *retourner* les arguments de sortie, à nouveau avec la vraie valeur de retour en premier s'il y en a une.

```c
void
gtk_widget_measure (GtkWidget *widget,
                    GtkOrientation orientation,
                    int for_size,
                    int *minimum,
                    int *natural,
                    int *minimum_baseline,
                    int *natural_baseline);
```

```javascript
class NewWidget extends Gtk.Widget {
  static GTypeName = 'NodeGTKNewWidget'
  virtual_measure(orientation, forSize, ...outs) {
    // les emplacements d'arguments de sortie arrive dans `outs` comme des placeholders `null`
    // ...calculer les dimensions...
    return [minimum, natural, minimumBaseline, naturalBaseline]
  }
}
```

#### Arguments nuls

Le C n'a pas d'arguments optionnels : lorsqu'un paramètre accepte "rien", passez `null` explicitement plutôt que d'omettre l'argument. C'est pourquoi tant d'appels se terminent par un littéral `null` — par exemple l'argument cancellable qui traverse Gio :

```javascript
const cursor = Gdk.Cursor.newFromName('pointer', null) // l'argument de secours est requis
```

#### Erreurs

Une fonction C dont le dernier paramètre est un `GError` signale l'échec en **lançant** une exception JavaScript — l'erreur n'apparaît jamais dans les valeurs retournées, donc traitez-la avec `try`/`catch` :

```javascript
try {
  const [ok, contents] = GLib.fileGetContents('/path/to/config')
  // ...utiliser contents...
} catch (err) {
  console.error('could not read the file:', err.message)  // levé en cas d'échec
}
```

## 6. Pièges courants

Parce que les liaisons vous donnent un accès direct aux fonctions C, une mauvaise utilisation d'une bibliothèque
peut planter le processus au lieu de lever une erreur interceptable. Quelques erreurs fréquentes :

<details>
  <summary><b>Utiliser des widgets avant l'initialisation de GTK</b></summary>
  GTK doit être initialisé avant de créer des widgets. <code>Gtk.Application</code>
  / <code>Adw.Application</code> le font pour vous — donc construisez votre interface dans le gestionnaire
  <code>activate</code>, pas au niveau du module. Sans application,
  appelez d'abord <code>Gtk.init()</code>.
</details>

<details>
  <summary><b>Omettre un argument requis</b></summary>
  Les fonctions C n'ont pas de paramètres optionnels. Passez chaque argument listé dans la signature — y compris un littéral <code>null</code> pour des éléments comme un cancellable ou une valeur de secours. Voir <a href="#5-appels-de-fonction">§5 → Arguments nuls</a>.
</details>

<details>
  <summary><b>Obtenir un display provoque un segfault (X11)</b></summary>
  Les APIs spécifiques au backend vivent dans leur propre espace de noms — sous X11, vous devrez peut-être
  importer <code>GdkX11 from 'gi:GdkX11-4.0'</code> avant d'y accéder.
</details>
