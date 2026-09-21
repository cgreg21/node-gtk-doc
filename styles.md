# Styles & rechargement à chaud

`node-gtk/styles` est un petit utilitaire pour appliquer du CSS à une application GTK — et, en développement, **recharger à chaud** pour que la fenêtre se mette à jour pendant que vous éditez, sans redémarrage. Il encapsule le ballet habituel `Gtk.CssProvider` + `Gtk.StyleContext` derrière un objet unique `styles`.

```javascript
import { styles } from 'node-gtk/styles'
```

Il cible GTK 4 (la version déjà chargée par votre application est utilisée automatiquement).

Les applications créées avec [`node-gtk create`](https://github.com/romgrk/node-gtk#usage) câblent déjà cela — leur `style.css` est rechargé à chaud sous `npm run dev` par défaut.

## Démarrage rapide

```javascript
import Gtk from 'gi:Gtk-4.0'
import { styles } from 'node-gtk/styles'

app.on('activate', () => {
  // Un fichier .css (re-lu en direct à l'édition en développement) :
  styles.addFile(new URL('../style.css', import.meta.url))

  // CSS inline :
  styles.add(`button.suggested-action { padding: 0 24px; }`)

  // ...construire votre fenêtre...

  styles.install()   // appliquer les styles en file d'attente et démarrer le watcher
  window.present()
})
```

## Les deux façons d'ajouter des styles

| Méthode | À utiliser pour | Rechargement à chaud |
| --- | --- | --- |
| `styles.addFile(path)` | une feuille de style `.css` | relit le fichier dans son provider |
| `styles.add(css)` | du CSS inline | réimporte ce module (voir l'avertissement ci-dessous) |

Les deux renvoient un **handle** — `{ update(next), refresh(), remove() }` — pour que vous puissiez remplacer, réappliquer ou retirer une feuille plus tard dans le code :

```javascript
const sheet = styles.add(`label { color: red; }`)
sheet.update(`label { color: green; }`)   // remplacer en place
sheet.remove()                            // retirer de l'affichage
```

## Feuilles de style dynamiques

Pour un CSS construit à partir d'un état en direct — palette de thème, polices actuelles — passez une **fonction de rendu** (`() => string`) à `styles.add` au lieu d'une chaîne. Elle s'exécute immédiatement, à nouveau à chaque rechargement à chaud de son module (donc l'édition du code générant le CSS le réapplique), et à la demande quand vous appelez `refresh()` sur le handle — ce que vous faites à chaque changement d'état qu'il lit :

```javascript
const sheet = styles.add(() => `:root { --accent: ${theme.accent}; }`)
// ...plus tard, quand le thème change :
theme.onChange(() => sheet.refresh())     // réexécute le rendu
```

`refresh()` réapplique une feuille depuis sa source actuelle (réexécute le rendu, ou relit un fichier `.css`). `update(css)` fixe au contraire la feuille à une chaîne fixe, en supprimant toute fonction de rendu.

Une fonction de rendu vit toujours dans un module qu'un reload réimporte, donc la même règle d'absence d'effets de bord s'applique (ci-dessous). Quand le CSS dynamique appartient à un module **stateful** qui ne peut pas être réimporté sans danger — son `add` s'exécute dans une méthode, ou il possède un singleton avec listeners — passez `{ watch: false }` pour l'installer sans surveillance ; vous le réappliquez vous-même via `refresh()`.

## Quand les styles s'installent

Le display par défaut n'existe pas au moment de l'initialisation du module, donc les styles ajoutés avant l'activation de l'application sont **mis en file d'attente**. Appelez `styles.install()` une fois depuis votre gestionnaire `activate` pour vider la file (et démarrer le watcher de fichiers). Les styles ajoutés *après* que le display existe s'installent immédiatement — et le premier appel auto-vide la file, donc une application qui fait tout son style dans `activate` n'a pas strictement besoin de `install()`.

`priority` vaut par défaut `Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION`; passez `{ priority }` pour le remplacer.

## Rechargement à chaud

Le rechargement à chaud ne s'exécute **que si `NODE_ENV=development`** (et est silencieusement désactivé sinon — en production rien n'est surveillé). Les applications créées avec `node-gtk create` le configurent déjà dans leur script `npm run dev`. Vous pouvez désactiver avec `NODE_GTK_STYLE_HOT_RELOAD=0`.

Chaque fichier qui contribue des styles est surveillé — via le `GFileMonitor` de GLib, pas le `fs.watch` de Node, donc il est piloté par la boucle principale GTK que l'application exécute déjà (un handle `fs.watch` est silencieusement jamais servi une fois cette boucle la seule active, et garderait le processus vivant après la fermeture de la fenêtre) :

- **Un fichier `.css`** est relu dans son provider existant. GTK re-résout la cascade de styles en direct — pas de flash, pas de redémarrage. Une règle malformée en cours d'édition est simplement ignorée par GTK (et journalisée), laissant le reste appliqué.

- **Un module source** qui a appelé `styles.add()` est réimporté avec une query de cache-busting, de sorte que ses appels `add()` réinstallent le nouveau CSS ; les providers de l'exécution précédente sont ensuite retirés. Les nouveaux feuilles montent *avant* que les anciennes descendent, pour qu'il n'y ait pas de flash non stylé. Si le module échoue à charger en cours d'édition (par ex. une erreur de syntaxe), il revient aux feuilles précédemment fonctionnelles.

### Avertissement : gardez le CSS inline rechargeable dans un module sans effets de bord

Recharger un CSS inline **réexécute tout le module** dans lequel il vit. Donc placez les appels `styles.add()` rechargeables dans un module dont le niveau supérieur n'enregistre que des styles — jamais à côté de `app.run()` / construction de fenêtre, sinon un reload relancerait tout cela. Un bon pattern :

```javascript
// styles.ts — sûr à relancer : il enregistre seulement des styles
import { styles } from 'node-gtk/styles'
styles.add(`.headline { font-size: 20px; font-weight: bold; }`)
```

```javascript
// main.ts — importe le module styles ; ne mettez jamais de CSS rechargeable ici
import './styles.ts'
```

Voir [`examples/style-manager.mjs`](https://github.com/romgrk/node-gtk/blob/master/examples/style-manager.mjs) pour une démo exécutable des deux chemins de recharge.

## API

| Membre | Description |
| --- | --- |
| `styles.add(css, { priority?, watch? })` | CSS inline, ou fonction de rendu `() => string`; rechargé à chaud via réimportation du module. `watch: false` désactive la surveillance. Retourne un handle. |
| `styles.addFile(path, { priority?, watch? })` | Fichier `.css` (chaîne, URL `file://`, ou `URL`); rechargé à chaud en relisant le fichier. Idempotent par chemin. Retourne un handle. |
| `styles.install()` | Installe les styles en file d'attente et démarre le watcher. |

Le handle retourné par `add` / `addFile` est `{ update(next), refresh(), remove() }`.
`StyleManager` (la classe) et l'instance partagée `styles` sont les seules exportations.
