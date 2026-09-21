# TypeScript

node-gtk peut générer des déclarations TypeScript pour les bibliothèques que vous utilisez,
à partir des typelibs GObject-Introspection installés sur votre machine — ainsi les types correspondent toujours à vos versions réelles des bibliothèques et à la forme runtime de node-gtk (méthodes camelCase, callbacks de signal, nullabilité, etc.).

```sh
# génère ./node_modules/.node-gtk-types (un cache masqué, git-ignoré)
npx node-gtk generate-types Gtk-4.0 Adw-1
```

La commande émet un fichier de déclaration par espace de noms (plus la fermeture complète des dépendances) et un shim `node-gtk.d.ts`. Pointez votre `tsconfig.json` dessus :

```jsonc
{
  "compilerOptions": {
    "moduleResolution": "node16",
    "paths": { "node-gtk": ["./node_modules/.node-gtk-types/node-gtk.d.ts"] }
  }
}
```

Ensuite, `gi.require` est entièrement typé — l'espace de noms est déduit depuis les arguments string :

```ts
import * as gi from 'node-gtk'

const Gtk = gi.require('Gtk', '4.0')   // typé comme l'espace de noms Gtk-4.0
const win = new Gtk.ApplicationWindow({ title: 'Hello', defaultWidth: 400 })
win.on('close-request', () => false)   // nom du signal + callback typés
```

La forme d'import direct `gi:` est aussi typée — le shim généré déclare chaque module `gi:<Namespace>-<version>`, donc son export par défaut est l'espace de noms :

```ts
import Gtk from 'gi:Gtk-4.0'           // typé comme l'espace de noms Gtk-4.0
const win = new Gtk.ApplicationWindow({ title: 'Hello', defaultWidth: 400 })
```

Vous obtenez des propriétés de constructeur typées (y compris les héritées et les interfaces), des méthodes camelCase avec vrais types de retour, la nullabilité GI, les surcharges de signal typées, les énumérations, `bigint` pour les entiers 64 bits, les paramètres out remontés comme valeur de retour, et les types inter-espaces de noms. La documentation GNOME est incluse en JSDoc (avec `@param`/`@returns`), donc les éditeurs l'affichent au survol — cela lit les fichiers `.gir` installés par les paquets `-dev`/`-devel` des bibliothèques ; passez `--no-docs` pour une sortie plus légère si elles ne sont pas installées ou si vous ne voulez pas les docs.

Comme la sortie est un cache généré sous `node_modules`, ajoutez un script `postinstall` pour la régénérer à l'installation :

```json
{ "scripts": { "postinstall": "node-gtk generate-types Gtk-4.0 Adw-1" } }
```

Exécutez `npx node-gtk generate-types --help` pour voir les options.
