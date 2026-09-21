# Importer des bibliothèques

Pour utiliser les bibliothèques natives (GTK, GLib, Adwaita, …), exécutez votre application avec le hook
`node-gtk/register` :

```sh
node --import node-gtk/register app.mjs
```

et importez n'importe quelle bibliothèque avec `import Name from 'gi:Name-Version'` :

```javascript
import GLib from 'gi:GLib-2.0'
import Gtk from 'gi:Gtk-4.0'
import Adw from 'gi:Adw-1'
```

Pour voir les bibliothèques et versions installées, exécutez `node-gtk list`.

L'**export par défaut est l'objet espace de noms** — tout ce que la bibliothèque
fournit est lu depuis celui-ci :

```javascript
import Gtk from 'gi:Gtk-4.0'

const { Box, Label } = Gtk
const box = new Box({ orientation: Gtk.Orientation.VERTICAL })
```

Les imports nommés (`import { Box } from 'gi:Gtk-4.0'`) ne sont **pas** pris en charge —
désstructurez à partir de l'export par défaut.

Le hook `node-gtk/register` configure aussi les options recommandées de Node.js et GTK pour le GPU,
voir [optimisations de performance](#optimisations-de-performance) pour plus de détails.

## Un exemple complet

```javascript
// app.mjs — exécuter avec : node --import node-gtk/register app.mjs
import GLib from 'gi:GLib-2.0'
import Gtk from 'gi:Gtk-4.0'
import Adw from 'gi:Adw-1'

const loop = GLib.MainLoop.new(null, false)
const app = new Adw.Application('com.example.hello', 0)

app.on('activate', () => {
  const content = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
  content.append(new Adw.HeaderBar())
  content.append(new Gtk.Label({ label: 'Hello Adwaita!', vexpand: true }))

  const window = new Adw.ApplicationWindow(app)
  window.setTitle('node-gtk')
  window.setDefaultSize(300, 120)
  window.setContent(content)
  window.on('close-request', () => (loop.quit(), app.quit(), false))
  window.present()

  loop.run()
})

app.run([])
```

Plus d'exemples dans [le dossier examples de node-gtk](https://github.com/romgrk/node-gtk/tree/master/examples).


## Autres sujets

> [!NOTE]
> Cette section couvre des sujets que vous n'avez pas besoin de connaître si vous commencez simplement
> votre application.

### API node-gtk (gobject-introspection)

L'API de node-gtk elle-même (`registerClass`, …) est importée depuis le package `node-gtk`
par nom :

```javascript
import gi, { registerClass } from 'node-gtk'
```
### La boucle d'événements

La première fois que vous lancez une boucle principale (`GLib.MainLoop.run`,
`Gio`/`Gtk.Application.run`, `Gtk.main`), node-gtk l'intègre à la boucle d'événements de Node pour vous — les timers, les promesses et les E/S continuent de fonctionner, et il n'y a rien à appeler pour l'activer.

Une chose à savoir : sous ESM, ces appels `run` **retournent immédiatement** au lieu de bloquer, et **ne retournent aucune valeur** — donc faites appel à `run` en dernière instruction
et nettoyez/quittez depuis les gestionnaires. L'exemple ci-dessus fait exactement cela : le gestionnaire `close-request` quitte la boucle et l'application, puis le processus se termine. Pour la raison et le compromis de conception, consultez
[#449](https://github.com/romgrk/node-gtk/issues/449).

### Ignorer le drapeau `--import`

Le drapeau n'est requis que pour un `import … from 'gi:…'` **statique** dans le fichier que vous exécutez directement : ESM résout tout le graphe statique avant toute exécution, donc les hooks doivent être installés au préalable. Vous pouvez l'éviter de plusieurs manières :

```javascript
// 1) Enregistrer programmatique, puis utiliser un import dynamique (sans drapeau) :
import 'node-gtk/register'
const Gtk = (await import('gi:Gtk-4.0')).default

// 2) Petit point d'entrée de bootstrap — enregistrez, puis chargez l'application réelle, qui peut
//    utiliser un `import … from 'gi:…'` statique (elle se charge après l'enregistrement) :
import 'node-gtk/register'
await import('./app.mjs')
```

Ou déplacez le drapeau dans l'environnement au lieu de la ligne de commande :
`NODE_OPTIONS="--import node-gtk/register" node app.mjs` (par exemple dans un script npm).

### Optimisations de performance

En plus d'installer les hooks `gi:`, `node-gtk/register` applique deux
optimisations au chargement :

- **Cache de compilation V8 persistant** — le bytecode compilé (et débarrassé des types) est persisté entre les exécutions, pour un démarrage significativement plus rapide sur des graphes de modules de taille d'application. Le cache se trouve dans `$XDG_CACHE_HOME/node-compile-cache`
  (`~/.cache/node-compile-cache` par défaut) ; définissez `NODE_COMPILE_CACHE` pour modifier
  l'emplacement ou `NODE_DISABLE_COMPILE_CACHE=1` pour le désactiver.

- **Rendu GL sous Linux** — GTK ≥ 4.22 utilise par défaut le moteur Vulkan. Sur les portables dual-GPU où le seul ICD Vulkan est NVIDIA (configuration Optimus classique), cela affiche chaque fenêtre sur le GPU discret : le réveil ajoute ~1 s au premier rendu à chaque lancement, et le système reste éveillé — consommant la batterie — pendant toute la durée de vie de l'application, même si l'affichage se fait sur le GPU intégré. Le hook d'enregistrement définit par défaut `GSK_RENDERER=gl` (le moteur GL, qui suit l'appareil du compositeur) au lieu de cela. Définir `GSK_RENDERER` vous-même a la priorité — n'importe quelle valeur, y compris `''` pour retrouver le choix de GTK.

### CommonJS

node-gtk fonctionne également sous CommonJS. Chargez les espaces de noms avec
`gi.require(name, version)` au lieu d'imports `gi:` — les deux sont équivalents,
et le reste de l'API est identique :

```javascript
const gi = require('node-gtk')
const GLib = gi.require('GLib', '2.0')
const Gtk = gi.require('Gtk', '4.0')
```

Vous l'exécutez avec `node app.js` simple — pas de drapeau `--import`. Les différences par rapport
à ESM :

- Les appels `run` de la boucle principale **bloquent** et renvoient leur résultat, de sorte que
  `process.exit(app.run([]))` fonctionne comme en C.
- Les [optimisations de performance](#optimisations-de-performance) ne sont pas appliquées —
  elles vivent dans le hook d'enregistrement. Pour les obtenir, exécutez avec le même drapeau
  `--import node-gtk/register` (cela fonctionne quel que soit le système de modules du point d'entrée).

## Voir aussi

- [Référence API](./api.md) — `require`, `registerClass`, et le reste de l'API
  de node-gtk.
- [TypeScript](./typescript.md) — imports `gi:` typés et `gi.require`.
