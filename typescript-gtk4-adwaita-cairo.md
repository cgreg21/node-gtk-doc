# GTK4, Adwaita et Cairo avec TypeScript

Ce guide montre comment utiliser **GTK4**, **Adwaita** et **Cairo** avec
TypeScript et node-gtk. Les types sont générés à partir des fichiers
GObject-Introspection installés sur votre système ; ils correspondent donc aux
versions réellement disponibles dans votre environnement.

## 1. Préparer le projet

Initialisez un projet TypeScript et installez node-gtk :

```sh
npm init -y
npm install node-gtk
npm install --save-dev typescript
```

Générez les déclarations pour les trois bibliothèques :

```sh
npx node-gtk generate-types Gtk-4.0 Adw-1 cairo-1.0
```

La commande crée `node_modules/.node-gtk-types`. Ajoutez le shim généré à
`tsconfig.json` :

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "node-gtk": [
        "./node_modules/.node-gtk-types/node-gtk.d.ts"
      ]
    },
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

Pour régénérer les types après `npm install`, ajoutez un script :

```json
{
  "scripts": {
    "generate-types": "node-gtk generate-types Gtk-4.0 Adw-1 cairo-1.0",
    "build": "tsc",
    "start": "node --import node-gtk/register dist/main.js"
  }
}
```

Les paquets de développement des bibliothèques doivent être installés pour
disposer des fichiers `.gir` et `.typelib`. Vérifiez les versions reconnues
par node-gtk avec :

```sh
npx node-gtk list
```

## 2. Importer les espaces de noms

L'import ESM direct est typé par le shim :

```ts
import Adw from 'gi:Adw-1'
import Cairo from 'gi:cairo-1.0'
import Gtk from 'gi:Gtk-4.0'
```

Exécutez le programme avec le hook node-gtk :

```sh
node --import node-gtk/register dist/main.js
```

Les imports nommés ne sont pas pris en charge. Utilisez l'export par défaut
puis les membres de l'espace de noms :

```ts
const button = new Gtk.Button({ label: 'Cliquez-moi' })
const surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, 320, 200)
```

## 3. Application GTK4 avec Adwaita

Adwaita fournit l'application et la fenêtre adaptées à GNOME, tandis que GTK
fournit les widgets génériques :

```ts
import Adw from 'gi:Adw-1'
import Gtk from 'gi:Gtk-4.0'

const app = new Adw.Application('com.example.TypeScriptDemo', 0)

app.on('activate', () => {
  const title = new Gtk.Label({
    label: 'GTK4 + Adwaita + TypeScript',
    hexpand: true,
    vexpand: true
  })

  const window = new Adw.ApplicationWindow(app, {
    title: 'Démonstration',
    defaultWidth: 640,
    defaultHeight: 420
  })

  const header = new Adw.HeaderBar()
  const toolbar = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12
  })
  toolbar.append(header)
  toolbar.append(title)

  window.setContent(toolbar)
  window.present()
})

app.run([])
```

Les propriétés passées au constructeur sont vérifiées par TypeScript. Les
méthodes, propriétés, énumérations et signaux proviennent des typelibs :

```ts
const orientation: Gtk.Orientation = Gtk.Orientation.VERTICAL
const closeHandler = (): boolean => false

toolbar.setOrientation(orientation)
window.on('close-request', closeHandler)
```

Les noms de signaux restent ceux de GTK, en `dash-case`. Les callbacks
incompatibles avec la signature du signal sont rejetés par TypeScript.

## 4. Dessiner avec Cairo dans Gtk.DrawingArea

`Gtk.DrawingArea` appelle une fonction de dessin avec le widget, un contexte
Cairo et les dimensions de la zone. Le contexte fourni par GTK est déjà
configuré pour la surface à dessiner : il ne faut pas le détruire.

```ts
import Cairo from 'gi:cairo-1.0'
import Gtk from 'gi:Gtk-4.0'

export function createCanvas(): Gtk.DrawingArea {
  const area = new Gtk.DrawingArea()
  area.setContentWidth(320)
  area.setContentHeight(200)
  area.setDrawFunc((
    _area: Gtk.DrawingArea,
    cr: Cairo.Context,
    width: number,
    height: number
  ): void => {
    cr.setSourceRgb(0.12, 0.25, 0.45)
    cr.rectangle(0, 0, width, height)
    cr.fill()

    cr.setSourceRgb(1, 1, 1)
    cr.setLineWidth(4)
    cr.arc(width / 2, height / 2, Math.min(width, height) / 4, 0, 2 * Math.PI)
    cr.stroke()
  })
  return area
}
```

Pour redessiner la zone après une modification d'état, appelez
`queueDraw()` :

```ts
let progress = 0
const area = createCanvas()

area.setDrawFunc((_area, cr, width, height) => {
  cr.setSourceRgb(0.1, 0.1, 0.1)
  cr.paint()
  cr.setSourceRgb(0.2, 0.75, 0.45)
  cr.rectangle(0, 0, width * progress, height)
  cr.fill()
})

progress = 0.75
area.queueDraw()
```

Les fonctions de dessin Cairo modifient le contexte fourni. Les objets Cairo
créés explicitement, comme `ImageSurface`, restent soumis à la durée de vie
de leurs wrappers node-gtk ; libérez-les selon les règles de l'API Cairo et
évitez de conserver un contexte de dessin fourni par GTK après le callback.

## 5. Exemple complet

Le fichier suivant combine une fenêtre Adwaita, un bouton GTK et un dessin
Cairo :

```ts
import Adw from 'gi:Adw-1'
import Cairo from 'gi:cairo-1.0'
import Gtk from 'gi:Gtk-4.0'

const app = new Adw.Application('com.example.CairoDemo', 0)

app.on('activate', () => {
  let progress = 0.35
  const canvas = new Gtk.DrawingArea()
  canvas.setContentWidth(480)
  canvas.setContentHeight(260)

  canvas.setDrawFunc((_area, cr, width, height) => {
    cr.setSourceRgb(0.08, 0.09, 0.12)
    cr.paint()
    cr.setSourceRgb(0.35, 0.65, 1)
    cr.rectangle(0, 0, width * progress, height)
    cr.fill()
  })

  const button = new Gtk.Button({ label: 'Avancer' })
  button.on('clicked', () => {
    progress = Math.min(progress + 0.1, 1)
    canvas.queueDraw()
  })

  const content = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12,
    marginTop: 12,
    marginBottom: 12,
    marginStart: 12,
    marginEnd: 12
  })
  content.append(canvas)
  content.append(button)

  const window = new Adw.ApplicationWindow(app, {
    title: 'Dessin Cairo',
    defaultWidth: 520,
    defaultHeight: 360,
    content
  })
  window.present()
})

app.run([])
```

Le type `Cairo.Context` est utilisé ici uniquement pour typer le callback ;
le contexte est fourni par GTK. Il n'est pas nécessaire d'instancier
`Cairo.Context` pour dessiner dans un `DrawingArea`.

## 6. Bonnes pratiques TypeScript

- Régénérez les typages lorsque la version de GTK, Adwaita ou Cairo change.
- Utilisez les énumérations (`Gtk.Orientation.VERTICAL`,
  `Cairo.Format.ARGB32`) plutôt que des nombres littéraux.
- Respectez la nullabilité indiquée par GObject-Introspection ; ne remplacez
  pas systématiquement les valeurs éventuellement nulles par `!`.
- Gardez les noms de bibliothèques et versions dans les imports exactement
  comme dans `npx node-gtk list`.
- N'appelez pas `destroy()` sur un objet GTK4 qui est géré par son parent ;
  retirez-le de l'arbre de widgets ou laissez la gestion des références de
  GObject s'en charger.
- Consultez la documentation officielle pour les détails de comportement :
  [GTK4](https://docs.gtk.org/gtk4/),
  [Adwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/) et
  [Cairo](https://cairographics.org/manual/).

## 7. Problèmes fréquents

### `Cannot find module 'gi:Gtk-4.0'`

Le hook n'est pas chargé assez tôt. Utilisez :

```sh
node --import node-gtk/register dist/main.js
```

### Les types de `gi:` sont introuvables

Régénérez les déclarations et vérifiez le chemin `paths` de `tsconfig.json` :

```sh
npx node-gtk generate-types Gtk-4.0 Adw-1 cairo-1.0
```

### Cairo n'est pas disponible

Installez les fichiers de développement et le typelib Cairo, puis vérifiez
le résultat de `npx node-gtk list`. La version habituellement utilisée est
`cairo-1.0`.

