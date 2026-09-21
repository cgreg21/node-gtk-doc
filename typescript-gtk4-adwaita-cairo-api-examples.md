# API et exemples TypeScript : GTK4, Adwaita et Cairo

Ce manuel est une référence pratique pour développer une application GNOME
avec **node-gtk**, **TypeScript**, **GTK4**, **Libadwaita** et **Cairo**.

Il couvre :

- l'installation et la génération des déclarations TypeScript ;
- les conventions de l'API node-gtk ;
- les widgets GTK4 et Adwaita par famille ;
- les modèles, signaux, actions et contrôleurs ;
- le dessin Cairo et l'intégration avec `Gtk.DrawingArea` ;
- des exemples complets, réutilisables dans une application réelle.

Les typelibs installés sur la machine sont déterminants. Les signatures
présentées ici correspondent aux API GTK4/Adwaita courantes ; la déclaration
générée localement dans `node_modules/.node-gtk-types` fait toujours foi.

## 1. Installation et versions

```sh
npm init -y
npm install node-gtk
npm install --save-dev typescript

npx node-gtk list
npx node-gtk generate-types \
  Gtk-4.0 \
  Adw-1 \
  cairo-1.0 \
  Gdk-4.0 \
  Graphene-1.0 \
  Gio-2.0 \
  Pango-1.0
```

Les paquets de développement doivent fournir les fichiers `.gir` et
`.typelib`. Utilisez la version GTK et la version Adwaita effectivement
installées :

```sh
npx node-gtk list
```

### `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
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

### Scripts recommandés

```json
{
  "scripts": {
    "generate-types": "node-gtk generate-types Gtk-4.0 Adw-1 cairo-1.0 Gdk-4.0 Graphene-1.0 Gio-2.0 Pango-1.0",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "start": "node --import node-gtk/register dist/main.js",
    "dev": "NODE_ENV=development node --import node-gtk/register dist/main.js"
  }
}
```

## 2. Imports et démarrage

```ts
import Adw from 'gi:Adw-1'
import Cairo from 'gi:cairo-1.0'
import Gio from 'gi:Gio-2.0'
import Gdk from 'gi:Gdk-4.0'
import Gtk from 'gi:Gtk-4.0'
import Pango from 'gi:Pango-1.0'
```

Lancez un fichier compilé avec :

```sh
node --import node-gtk/register dist/main.js
```

Le hook `node-gtk/register` doit être installé avant la résolution d'un
import statique `gi:`. Alternative sans option Node :

```ts
import 'node-gtk/register'

const Gtk = (await import('gi:Gtk-4.0')).default
```

L'export d'un espace de noms est l'export par défaut. Les imports nommés ne
sont pas utilisés :

```ts
import Gtk from 'gi:Gtk-4.0'

const { Button, Label } = Gtk
const button = new Button({ label: 'OK' })
const label = new Label({ label: 'Bonjour' })
```

## 3. Conventions de l'API node-gtk

### Noms

| API C/GObject | API TypeScript node-gtk |
| --- | --- |
| `gtk_button_set_label` | `button.setLabel()` |
| `gtk_widget_get_visible` | `widget.getVisible()` |
| `gtk_widget_set_visible` | `widget.setVisible()` |
| `GTK_ORIENTATION_VERTICAL` | `Gtk.Orientation.VERTICAL` |
| propriété `default-width` | `defaultWidth` |
| signal `notify::active` | `'notify::active'` |

Les propriétés peuvent être passées au constructeur :

```ts
const box = new Gtk.Box({
  orientation: Gtk.Orientation.VERTICAL,
  spacing: 8,
  marginTop: 12
})
```

Le même objet peut être modifié avec ses accesseurs :

```ts
box.setSpacing(16)
box.setMarginTop(24)
console.log(box.getSpacing())
```

### Signaux

```ts
button.on('clicked', () => {
  console.log('clic')
})

entry.on('changed', () => {
  console.log(entry.getText())
})

window.on('close-request', (): boolean => {
  return false
})
```

Les noms de signaux restent en `dash-case`. Les signaux de notification
utilisent `notify::nom-de-propriete`.

### Enums, flags et nullabilité

```ts
const vertical: Gtk.Orientation = Gtk.Orientation.VERTICAL
const copy: Gdk.DragAction = Gdk.DragAction.COPY
const format: Cairo.Format = Cairo.Format.ARGB32
```

Respectez les valeurs nullable des déclarations générées. Ne remplacez pas
chaque valeur éventuellement nulle par `!` sans vérifier le cas réel.

## 4. Cycle de vie d'une application

`Gtk.Application` ou `Adw.Application` initialise le contexte GTK et gère les
fenêtres de l'application. Construisez l'interface dans `activate`.

```ts
import Adw from 'gi:Adw-1'
import Gtk from 'gi:Gtk-4.0'

const app = new Adw.Application('com.example.Demo', 0)

app.on('activate', () => {
  const window = new Adw.ApplicationWindow(app, {
    title: 'Démonstration',
    defaultWidth: 640,
    defaultHeight: 420
  })

  window.setContent(new Gtk.Label({
    label: 'Bienvenue',
    hexpand: true,
    vexpand: true
  }))
  window.present()
})

app.run([])
```

Sous ESM, l'intégration de la boucle principale est non bloquante. Appelez
`app.run([])` en dernière instruction et quittez depuis les gestionnaires.

## 5. API de base de `Gtk.Widget`

Toutes les classes GTK visuelles héritent de `Gtk.Widget`.

### Taille et alignement

```ts
widget.setHexpand(true)
widget.setVexpand(true)
widget.setHalign(Gtk.Align.FILL)
widget.setValign(Gtk.Align.CENTER)
widget.setMarginTop(12)
widget.setMarginBottom(12)
widget.setMarginStart(12)
widget.setMarginEnd(12)
widget.setSizeRequest(240, 80)
```

### Visibilité, sens et états

```ts
widget.setVisible(true)
widget.setSensitive(false)
widget.setFocusable(true)
widget.setCanTarget(true)
widget.setDirection(Gtk.TextDirection.LTR)
```

### CSS et tooltip

```ts
widget.addCssClass('card')
widget.removeCssClass('dim-label')
widget.setTooltipText('Description de l’action')
```

### Arbre des widgets

```ts
const parent = new Gtk.Box()
const child = new Gtk.Label({ label: 'Enfant' })

parent.append(child)
parent.remove(child)
parent.insertChildAfter(new Gtk.Button({ label: 'Après' }), null)
```

Les méthodes disponibles pour ajouter ou retirer un enfant dépendent du
conteneur. Utilisez `setChild` pour un conteneur à enfant unique et `append`
pour un conteneur séquentiel.

## 6. Conteneurs GTK4

### `Gtk.Box`

```ts
const column = new Gtk.Box({
  orientation: Gtk.Orientation.VERTICAL,
  spacing: 12
})
column.append(new Gtk.Label({ label: 'Titre' }))
column.append(new Gtk.Button({ label: 'Action' }))
```

### `Gtk.Grid`

```ts
const grid = new Gtk.Grid({ rowSpacing: 8, columnSpacing: 8 })
grid.attach(new Gtk.Label({ label: 'Nom' }), 0, 0, 1, 1)
grid.attach(new Gtk.Entry(), 1, 0, 2, 1)
grid.attach(new Gtk.Label({ label: 'Ville' }), 0, 1, 1, 1)
grid.attach(new Gtk.Entry(), 1, 1, 2, 1)
```

### `Gtk.Overlay`

```ts
const overlay = new Gtk.Overlay()
overlay.setChild(new Gtk.Picture({ paintable: background }))

const badge = new Gtk.Label({ label: 'Nouveau', cssClasses: ['badge'] })
overlay.addOverlay(badge)
overlay.setClipOverlay(badge, true)
```

### `Gtk.ScrolledWindow`

```ts
const scroller = new Gtk.ScrolledWindow({
  hscrollbarPolicy: Gtk.PolicyType.NEVER,
  vexpand: true
})
scroller.setChild(content)
```

### `Gtk.Paned`

```ts
const paned = new Gtk.Paned({ orientation: Gtk.Orientation.HORIZONTAL })
paned.setStartChild(navigation)
paned.setEndChild(details)
paned.setPosition(240)
paned.setResizeStartChild(false)
```

### `Gtk.Stack`

```ts
const stack = new Gtk.Stack({ vexpand: true })
stack.addTitled(home, 'home', 'Accueil')
stack.addTitled(settings, 'settings', 'Réglages')
stack.setVisibleChildName('home')

const switcher = new Gtk.StackSwitcher({ stack })
```

Autres conteneurs GTK4 : `Gtk.CenterBox`, `Gtk.Fixed`, `Gtk.Frame`,
`Gtk.Expander`, `Gtk.Revealer`, `Gtk.Separator`, `Gtk.AspectFrame`,
`Gtk.ConstraintLayout`, `Gtk.FlowBox`, `Gtk.ListBox`, `Gtk.Viewport`,
`Gtk.StackSidebar`, `Gtk.StackSwitcher`, `Gtk.HeaderBar` et `Gtk.ActionBar`.

## 7. Texte, boutons et contrôles

### Labels et entrée

```ts
const title = new Gtk.Label({
  label: 'Titre',
  halign: Gtk.Align.START,
  cssClasses: ['title-2']
})

const entry = new Gtk.Entry({
  placeholderText: 'Rechercher',
  hexpand: true
})
entry.on('activate', () => console.log(entry.getText()))

const password = new Gtk.PasswordEntry({ showPeekIcon: true })
const search = new Gtk.SearchEntry({ placeholderText: 'Filtrer' })
```

### Boutons

```ts
const normal = new Gtk.Button({ label: 'Normal' })
const suggested = new Gtk.Button({
  label: 'Continuer',
  cssClasses: ['suggested-action']
})
const destructive = new Gtk.Button({
  label: 'Supprimer',
  cssClasses: ['destructive-action']
})

normal.on('clicked', () => {})
```

Classes associées : `Gtk.ToggleButton`, `Gtk.CheckButton`, `Gtk.LinkButton`,
`Gtk.MenuButton`, `Gtk.ModelButton`, `Gtk.ScaleButton` et
`Gtk.VolumeButton`.

### Contrôles numériques

```ts
const scale = new Gtk.Scale({
  orientation: Gtk.Orientation.HORIZONTAL,
  hexpand: true,
  drawValue: true
})
scale.setRange(0, 100)
scale.setValue(35)

const spin = Gtk.SpinButton.newWithRange(0, 100, 1)
spin.setValue(42)

const progress = new Gtk.ProgressBar({ fraction: 0.42 })
const level = new Gtk.LevelBar({ value: 0.7 })
const spinner = new Gtk.Spinner({ spinning: true })
const toggle = new Gtk.Switch({ active: true })
```

### Choix

```ts
const model = Gtk.StringList.new(['Bas', 'Moyen', 'Élevé'])
const dropdown = new Gtk.DropDown({ model })
dropdown.on('notify::selected', () => {
  const index = dropdown.getSelected()
  console.log(model.getString(index))
})
```

Autres contrôles : `Gtk.Calendar`, `Gtk.ColorDialogButton`,
`Gtk.FontDialogButton` et `Gtk.ScaleButton`.

## 8. Listes, modèles et factories

### `Gtk.StringList` et `Gtk.DropDown`

```ts
const languages = Gtk.StringList.new(['Français', 'English', 'Deutsch'])
const language = new Gtk.DropDown({ model: languages })
```

### `Gio.ListStore`

```ts
const store = Gio.ListStore.new(Gtk.StringObject.$gtype)
store.append(new Gtk.StringObject('Premier'))
store.append(new Gtk.StringObject('Deuxième'))

const selection = new Gtk.SingleSelection({ model: store })
```

### `Gtk.ListView`

```ts
const factory = new Gtk.SignalListItemFactory()

factory.on('setup', (_factory, item) => {
  item.setChild(new Gtk.Label({ xalign: 0 }))
})

factory.on('bind', (_factory, item) => {
  const label = item.getChild() as Gtk.Label
  const value = item.getItem() as Gtk.StringObject
  label.setLabel(value.getString())
})

const list = new Gtk.ListView({ model: selection, factory })
```

Pour de grandes collections, utilisez `Gtk.ListView`, `Gtk.GridView`,
`Gtk.ColumnView`, `Gtk.FilterListModel`, `Gtk.SortListModel`,
`Gtk.StringFilter`, `Gtk.StringSorter`, `Gtk.NumericSorter`,
`Gtk.SingleSelection`, `Gtk.MultiSelection` et `Gtk.NoSelection`.

Pour une petite liste composée de widgets complets, `Gtk.ListBox` est plus
simple :

```ts
const listBox = new Gtk.ListBox()
for (const text of ['Un', 'Deux', 'Trois']) {
  listBox.append(new Gtk.ListBoxRow({
    child: new Gtk.Label({ label: text, xalign: 0 })
  }))
}
```

## 9. Actions, menus et raccourcis

```ts
const about = new Gio.SimpleAction('about')
about.on('activate', () => {
  const dialog = new Adw.AboutDialog({
    applicationName: 'Mon application',
    applicationIcon: 'applications-graphics',
    version: '1.0.0',
    developerName: 'Équipe',
    website: 'https://example.com'
  })
  dialog.present(window)
})
app.addAction(about)

const menu = new Gio.Menu()
menu.append('À propos', 'app.about')

const menuButton = new Gtk.MenuButton({
  iconName: 'open-menu-symbolic',
  tooltipText: 'Menu'
})
menuButton.setMenuModel(menu)
```

Les classes à connaître sont `Gio.SimpleAction`, `Gio.PropertyAction`,
`Gio.Menu`, `Gio.MenuItem`, `Gio.MenuModel`, `Gtk.PopoverMenu`,
`Gtk.PopoverMenuBar`, `Gtk.ShortcutController`, `Gtk.Shortcut`,
`Gtk.KeyvalTrigger`, `Gtk.CallbackAction`, `Gtk.NamedAction` et
`Gtk.SignalAction`.

## 10. Dialogues et fichiers

Les APIs modernes `Gtk.AlertDialog`, `Gtk.FileDialog`, `Gtk.ColorDialog` et
`Gtk.FontDialog` sont asynchrones dans les versions récentes de GTK. La forme
exacte dépend des typelibs :

```ts
const alert = new Gtk.AlertDialog({
  message: 'Supprimer ce fichier ?',
  detail: 'Cette action est irréversible.',
  buttons: ['Annuler', 'Supprimer']
})

// La signature exacte de choose() est vérifiée par le fichier .d.ts généré.
// Utilisez le callback ou la Promise exposée par votre version de GTK.
```

Widgets de sélection et fichiers :

`Gtk.FileDialog`, `Gtk.FileChooserWidget`, `Gtk.FileFilter`,
`Gtk.FileLauncher`, `Gtk.PlacesSidebar`, `Gtk.RecentManager`,
`Gtk.ColorDialog`, `Gtk.FontDialog`, `Gtk.PrintDialog`,
`Gtk.PrintOperation` et `Gtk.PrintUnixDialog`.

## 11. Adwaita : application et fenêtre

```ts
const app = new Adw.Application('com.example.AdwaitaDemo', 0)

app.on('activate', () => {
  const window = new Adw.ApplicationWindow(app, {
    title: 'Adwaita',
    defaultWidth: 720,
    defaultHeight: 480
  })

  const header = new Adw.HeaderBar()
  const view = new Adw.ToolbarView()
  view.addTopBar(header)
  view.setContent(new Gtk.Label({
    label: 'Contenu',
    hexpand: true,
    vexpand: true
  }))

  window.setContent(view)
  window.present()
})

app.run([])
```

Classes principales : `Adw.Application`, `Adw.ApplicationWindow`,
`Adw.HeaderBar`, `Adw.ToolbarView`, `Adw.WindowTitle`, `Adw.ViewStack`,
`Adw.ViewSwitcher`, `Adw.ViewSwitcherBar`, `Adw.NavigationView`,
`Adw.NavigationPage`, `Adw.NavigationSplitView`, `Adw.TabView`,
`Adw.TabBar` et `Adw.TabOverview`.

## 12. Adwaita : responsive design

```ts
const leaflet = new Adw.Leaflet({ canUnfold: false })
leaflet.append(navigation)
leaflet.append(details)

const clamp = new Adw.Clamp({ maximumSize: 720 })
clamp.setChild(content)

const view = new Adw.ToolbarView()
view.addTopBar(new Adw.HeaderBar())
view.setContent(clamp)
```

Classes adaptatives :

`Adw.Clamp`, `Adw.ClampScrollable`, `Adw.Bin`, `Adw.Flap`,
`Adw.Leaflet`, `Adw.Squeezer`, `Adw.WrapBox`, `Adw.MultiLayoutView`,
`Adw.NavigationSplitView` et `Adw.OverlaySplitView`.

## 13. Adwaita : préférences et formulaires

```ts
const account = new Adw.PreferencesGroup({
  title: 'Compte',
  description: 'Paramètres du compte'
})

const username = new Adw.EntryRow({ title: 'Nom d’utilisateur' })
const password = new Adw.PasswordEntryRow({ title: 'Mot de passe' })
const notifications = new Adw.SwitchRow({
  title: 'Notifications',
  subtitle: 'Recevoir les messages',
  active: true
})

account.add(username)
account.add(password)
account.add(notifications)

const page = new Adw.PreferencesPage()
page.add(account)
```

Widgets de préférences :

`Adw.PreferencesDialog`, `Adw.PreferencesPage`, `Adw.PreferencesGroup`,
`Adw.PreferencesRow`, `Adw.ActionRow`, `Adw.EntryRow`,
`Adw.PasswordEntryRow`, `Adw.ComboRow`, `Adw.SpinRow`, `Adw.SwitchRow` et
`Adw.ExpanderRow`.

## 14. Adwaita : notifications et états

```ts
const overlay = new Adw.ToastOverlay()
const content = new Gtk.Box({
  orientation: Gtk.Orientation.VERTICAL
})

const banner = new Adw.Banner({
  title: 'Connexion impossible',
  buttonLabel: 'Réessayer',
  revealed: true
})
banner.on('button-clicked', () => banner.setRevealed(false))
content.append(banner)

const action = new Gtk.Button({ label: 'Afficher un toast' })
action.on('clicked', () => {
  overlay.addToast(new Adw.Toast({
    title: 'Enregistré',
    buttonLabel: 'Annuler'
  }))
})
content.append(action)
overlay.setChild(content)
```

Classes : `Adw.Toast`, `Adw.ToastOverlay`, `Adw.Banner`, `Adw.StatusPage`,
`Adw.Avatar`, `Adw.AboutDialog`, `Adw.AlertDialog` et `Adw.MessageDialog`.

## 15. Adwaita : navigation et onglets

```ts
const navigation = new Adw.NavigationView()
const first = new Adw.NavigationPage({
  title: 'Accueil',
  child: new Gtk.Button({
    label: 'Ouvrir les détails'
  })
})
navigation.push(first)

const details = new Adw.NavigationPage({
  title: 'Détails',
  child: new Gtk.Label({ label: 'Détails' })
})

const open = first.getChild() as Gtk.Button
open.on('clicked', () => navigation.push(details))
```

Pour des onglets :

```ts
const tabs = new Adw.TabView()
tabs.addPage(new Gtk.Label({ label: 'Document 1' }), null)
tabs.addPage(new Gtk.Label({ label: 'Document 2' }), null)

const tabBar = new Adw.TabBar({ view: tabs })
```

Les signatures de `addPage`, `push`, `pop` et des méthodes d'onglets sont à
vérifier dans le `.d.ts` correspondant à la version libadwaita installée.

## 16. Cairo : contexte, chemins et couleurs

```ts
const canvas = new Gtk.DrawingArea({
  contentWidth: 480,
  contentHeight: 300
})

canvas.setDrawFunc((_area, cr, width, height) => {
  cr.save()
  cr.setSourceRgb(0.08, 0.1, 0.16)
  cr.rectangle(0, 0, width, height)
  cr.fill()

  cr.translate(width / 2, height / 2)
  cr.rotate(Math.PI / 8)
  cr.setSourceRgba(0.2, 0.6, 1, 0.85)
  cr.rectangle(-80, -40, 160, 80)
  cr.fillPreserve()
  cr.setSourceRgb(1, 1, 1)
  cr.setLineWidth(3)
  cr.stroke()
  cr.restore()
})
```

Méthodes Cairo courantes :

| Groupe | Méthodes |
| --- | --- |
| État | `save`, `restore`, `pushGroup`, `popGroup`. |
| Transformation | `translate`, `scale`, `rotate`, `setMatrix`, `getMatrix`. |
| Chemin | `moveTo`, `lineTo`, `curveTo`, `rectangle`, `arc`, `closePath`. |
| Source | `setSourceRgb`, `setSourceRgba`, `setSource`, `setSourceSurface`. |
| Rendu | `paint`, `paintWithAlpha`, `fill`, `fillPreserve`, `stroke`, `strokePreserve`. |
| Découpage | `clip`, `clipPreserve`, `resetClip`, `inClip`. |
| Texte | `selectFontFace`, `setFontSize`, `showText`, `textExtents`. |
| État | `getStatus`, `getOperator`, `setOperator`, `setLineWidth`. |

## 17. Cairo : surfaces et exports

```ts
const surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, 800, 600)
const cr = new Cairo.Context(surface)

cr.setSourceRgb(1, 1, 1)
cr.paint()
cr.setSourceRgb(0, 0, 0)
cr.moveTo(72, 72)
cr.setFontSize(24)
cr.showText('Rapport')

surface.writeToPng('rapport.png')
surface.finish()
```

Surfaces publiques : `Cairo.ImageSurface`, `Cairo.PdfSurface`,
`Cairo.SvgSurface`, `Cairo.RecordingSurface`, `Cairo.Surface`.

Pour du texte correctement aligné, utilisez Pango :

```ts
const layout = Pango.cairoCreateLayout(cr)
layout.setText('Texte aligné', -1)
layout.setAlignment(Pango.Alignment.CENTER)
Pango.cairoShowLayout(cr, layout)
```

## 18. `Gtk.DrawingArea` : exemple complet

```ts
let value = 0.35
const drawing = new Gtk.DrawingArea({
  contentWidth: 500,
  contentHeight: 260,
  hexpand: true,
  vexpand: true
})

drawing.setDrawFunc((_area, cr, width, height) => {
  cr.setSourceRgb(0.12, 0.13, 0.17)
  cr.paint()
  cr.setSourceRgb(0.3, 0.7, 0.95)
  cr.rectangle(0, 0, width * value, height)
  cr.fill()
})

const increase = new Gtk.Button({ label: 'Avancer' })
increase.on('clicked', () => {
  value = Math.min(1, value + 0.1)
  drawing.queueDraw()
})
```

Le contexte fourni par GTK est valide pendant le callback. Ne le stockez pas et
ne l'utilisez pas après le retour de la fonction de dessin.

## 19. Contrôleurs, focus et accessibilité

```ts
const keys = new Gtk.EventControllerKey()
keys.on('key-pressed', (keyval, _keycode, _state): boolean => {
  console.log(keyval)
  return false
})
button.addController(keys)
```

Classes d'interaction :

`Gtk.EventControllerFocus`, `Gtk.EventControllerKey`,
`Gtk.EventControllerMotion`, `Gtk.EventControllerScroll`,
`Gtk.GestureClick`, `Gtk.GestureDrag`, `Gtk.GestureLongPress`,
`Gtk.DropTarget`, `Gtk.DragSource` et `Gtk.ShortcutController`.

Classes et propriétés d'accessibilité :

`Gtk.Accessible`, `Gtk.AccessibleRole`, `Gtk.AccessibleState`,
`Gtk.AccessibleProperty` et les propriétés accessibles de `Gtk.Widget`.

Fournissez un label ou un nom accessible aux contrôles qui ne contiennent
qu'une icône :

```ts
const close = new Gtk.Button({
  iconName: 'window-close-symbolic',
  tooltipText: 'Fermer'
})
```

## 20. CSS, thèmes et styles

```ts
import Gdk from 'gi:Gdk-4.0'

const provider = new Gtk.CssProvider()
provider.loadFromData(`
  .demo-card {
    padding: 12px;
    border-radius: 12px;
  }
`)

const display = Gdk.Display.getDefault()
if (display) {
  Gtk.StyleContext.addProviderForDisplay(
    display,
    provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
  )
}
```

Classes Adwaita courantes :

`card`, `boxed-list`, `pill`, `circular`, `flat`, `suggested-action`,
`destructive-action`, `dim-label`, `heading`, `caption`, `title-1`,
`title-2`, `title-3` et `title-4`.

Pour le rechargement à chaud, consultez [styles.md](./styles.md).

## 21. Exemple complet : application Adwaita avec liste, toast et dessin

```ts
import Adw from 'gi:Adw-1'
import Gio from 'gi:Gio-2.0'
import Gtk from 'gi:Gtk-4.0'

const app = new Adw.Application('com.example.CompleteDemo', 0)

app.on('activate', () => {
  const overlay = new Adw.ToastOverlay()
  const root = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL
  })

  const header = new Adw.HeaderBar()
  const menu = new Gio.Menu()
  menu.append('À propos', 'app.about')
  header.packEnd(new Gtk.MenuButton({
    iconName: 'open-menu-symbolic',
    menuModel: menu
  }))
  root.append(header)

  const group = new Adw.PreferencesGroup({ title: 'Options' })
  const name = new Adw.EntryRow({ title: 'Nom' })
  const enabled = new Adw.SwitchRow({
    title: 'Activer',
    active: true
  })
  group.add(name)
  group.add(enabled)

  const button = new Gtk.Button({
    label: 'Enregistrer',
    cssClasses: ['suggested-action']
  })
  button.on('clicked', () => {
    overlay.addToast(new Adw.Toast({
      title: `Bonjour ${name.getText()}`
    }))
  })

  const content = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12,
    marginTop: 12,
    marginBottom: 12,
    marginStart: 12,
    marginEnd: 12
  })
  content.append(group)
  content.append(button)
  root.append(content)
  overlay.setChild(root)

  const window = new Adw.ApplicationWindow(app, {
    title: 'Démonstration complète',
    defaultWidth: 560,
    defaultHeight: 420,
    content: overlay
  })
  window.present()
})

app.run([])
```

## 22. Widgets GTK4 : inventaire par famille

La liste suivante couvre les widgets et objets API publics généralement
disponibles dans GTK4. Certains éléments sont des modèles, contrôleurs ou
objets de support plutôt que des widgets visuels.

### Base et disposition

`Gtk.Widget`, `Gtk.Window`, `Gtk.ApplicationWindow`, `Gtk.ActionBar`,
`Gtk.HeaderBar`, `Gtk.Box`, `Gtk.CenterBox`, `Gtk.Grid`, `Gtk.Fixed`,
`Gtk.ConstraintLayout`, `Gtk.Overlay`, `Gtk.Paned`, `Gtk.Frame`,
`Gtk.AspectFrame`, `Gtk.ScrolledWindow`, `Gtk.Viewport`, `Gtk.Separator`,
`Gtk.Expander`, `Gtk.Revealer`, `Gtk.Stack`, `Gtk.StackSidebar`,
`Gtk.StackSwitcher`, `Gtk.ListBox`, `Gtk.ListBoxRow`, `Gtk.FlowBox`,
`Gtk.FlowBoxChild`.

### Texte et édition

`Gtk.Label`, `Gtk.Entry`, `Gtk.EditableLabel`, `Gtk.PasswordEntry`,
`Gtk.SearchEntry`, `Gtk.Text`, `Gtk.TextView`, `Gtk.TextBuffer`,
`Gtk.TextIter`, `Gtk.TextMark`, `Gtk.TextTag`, `Gtk.TextTagTable`.

### Actions et boutons

`Gtk.Button`, `Gtk.ToggleButton`, `Gtk.CheckButton`, `Gtk.LinkButton`,
`Gtk.MenuButton`, `Gtk.ModelButton`, `Gtk.ScaleButton`,
`Gtk.VolumeButton`.

### Choix et indicateurs

`Gtk.Switch`, `Gtk.Scale`, `Gtk.SpinButton`, `Gtk.ProgressBar`,
`Gtk.LevelBar`, `Gtk.Spinner`, `Gtk.DropDown`, `Gtk.ComboBox`,
`Gtk.Calendar`, `Gtk.ColorDialogButton`, `Gtk.FontDialogButton`.

### Modèles et vues

`Gtk.ListView`, `Gtk.GridView`, `Gtk.ColumnView`,
`Gtk.ColumnViewColumn`, `Gtk.ColumnViewCell`, `Gtk.ListItem`,
`Gtk.ListItemFactory`, `Gtk.SignalListItemFactory`, `Gtk.StringList`,
`Gtk.StringObject`, `Gtk.SingleSelection`, `Gtk.MultiSelection`,
`Gtk.NoSelection`, `Gtk.FilterListModel`, `Gtk.SortListModel`,
`Gtk.StringFilter`, `Gtk.StringSorter`, `Gtk.NumericSorter`,
`Gtk.CustomFilter`, `Gtk.CustomSorter`, `Gtk.TreeExpander`.

### Images et médias

`Gtk.Image`, `Gtk.Picture`, `Gtk.DrawingArea`, `Gtk.GLArea`, `Gtk.Video`,
`Gtk.MediaFile`, `Gtk.MediaControls`.

### Menus, fenêtres système et impression

`Gtk.Popover`, `Gtk.PopoverMenu`, `Gtk.PopoverMenuBar`, `Gtk.AlertDialog`,
`Gtk.Dialog`, `Gtk.FileDialog`, `Gtk.FileChooserWidget`, `Gtk.FileFilter`,
`Gtk.FileLauncher`, `Gtk.ColorDialog`, `Gtk.FontDialog`, `Gtk.PrintDialog`,
`Gtk.PrintOperation`, `Gtk.PrintUnixDialog`, `Gtk.PlacesSidebar`,
`Gtk.RecentManager`.

### Événements et interaction

`Gtk.EventController`, `Gtk.EventControllerKey`,
`Gtk.EventControllerFocus`, `Gtk.EventControllerMotion`,
`Gtk.EventControllerScroll`, `Gtk.Gesture`, `Gtk.GestureClick`,
`Gtk.GestureDrag`, `Gtk.GestureLongPress`, `Gtk.DropTarget`,
`Gtk.DropControllerMotion`, `Gtk.DragSource`, `Gtk.DragIcon`,
`Gtk.ShortcutController`, `Gtk.Shortcut`, `Gtk.ShortcutsWindow`,
`Gtk.ShortcutsSection`, `Gtk.ShortcutsGroup`, `Gtk.ShortcutsShortcut`.

## 23. Widgets Adwaita : inventaire par famille

### Application, fenêtres et navigation

`Adw.Application`, `Adw.ApplicationWindow`, `Adw.HeaderBar`,
`Adw.ToolbarView`, `Adw.ViewStack`, `Adw.ViewSwitcher`,
`Adw.ViewSwitcherBar`, `Adw.NavigationView`, `Adw.NavigationPage`,
`Adw.NavigationSplitView`, `Adw.TabView`, `Adw.TabBar`, `Adw.TabButton`,
`Adw.TabOverview`, `Adw.WindowTitle`.

### Disposition adaptative

`Adw.Bin`, `Adw.Clamp`, `Adw.ClampScrollable`, `Adw.Flap`, `Adw.Leaflet`,
`Adw.Squeezer`, `Adw.WrapBox`, `Adw.MultiLayoutView`,
`Adw.OverlaySplitView`.

### Préférences et lignes

`Adw.PreferencesDialog`, `Adw.PreferencesPage`, `Adw.PreferencesGroup`,
`Adw.PreferencesRow`, `Adw.ActionRow`, `Adw.EntryRow`,
`Adw.PasswordEntryRow`, `Adw.ComboRow`, `Adw.SpinRow`, `Adw.SwitchRow`,
`Adw.ExpanderRow`.

### États et présentation

`Adw.AboutDialog`, `Adw.AlertDialog`, `Adw.MessageDialog`, `Adw.Banner`,
`Adw.StatusPage`, `Adw.Toast`, `Adw.ToastOverlay`, `Adw.Avatar`,
`Adw.Carousel`, `Adw.CarouselIndicatorDots`, `Adw.CarouselIndicatorLines`,
`Adw.SplitButton`, `Adw.ToggleGroup`.

## 24. Cairo : inventaire API

### Types

`Cairo.Context`, `Cairo.Surface`, `Cairo.ImageSurface`,
`Cairo.PdfSurface`, `Cairo.SvgSurface`, `Cairo.RecordingSurface`,
`Cairo.Pattern`, `Cairo.SolidPattern`, `Cairo.SurfacePattern`,
`Cairo.LinearGradient`, `Cairo.RadialGradient`, `Cairo.Matrix`,
`Cairo.Rectangle`, `Cairo.TextExtents`, `Cairo.FontExtents`.

### Énumérations

`Cairo.Format`, `Cairo.Operator`, `Cairo.Content`, `Cairo.FillRule`,
`Cairo.LineCap`, `Cairo.LineJoin`, `Cairo.Filter`, `Cairo.Extend`,
`Cairo.FontSlant`, `Cairo.FontWeight`, `Cairo.Status`.

### Méthodes de contexte

`save`, `restore`, `translate`, `scale`, `rotate`, `setMatrix`,
`getMatrix`, `newPath`, `moveTo`, `lineTo`, `curveTo`, `arc`,
`arcNegative`, `rectangle`, `closePath`, `setSourceRgb`, `setSourceRgba`,
`setSource`, `setSourceSurface`, `setLineWidth`, `setLineCap`,
`setLineJoin`, `setDash`, `setFillRule`, `fill`, `fillPreserve`,
`stroke`, `strokePreserve`, `paint`, `paintWithAlpha`, `clip`,
`clipPreserve`, `resetClip`, `selectFontFace`, `setFontSize`,
`showText`, `textExtents`, `mask`, `maskSurface`, `pushGroup`,
`popGroup`, `popGroupToSource`.

## 25. Vérifier une API localement

Les noms et signatures peuvent changer avec GTK, libadwaita ou Cairo. Inspectez
toujours les déclarations générées :

```powershell
Get-ChildItem node_modules\.node-gtk-types -Recurse -Filter '*.d.ts' |
  Select-String -Pattern 'class DrawingArea|class PreferencesGroup|class Context'
```

Pour une bibliothèque absente :

```sh
npx node-gtk list
npx node-gtk generate-types Gtk-4.0 Adw-1 cairo-1.0
```

Puis consultez :

- [GTK4 API](https://docs.gtk.org/gtk4/)
- [GTK4 visual index](https://docs.gtk.org/gtk4/visual_index.html)
- [Libadwaita API](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/)
- [Libadwaita widget gallery](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/widget-gallery.html)
- [Cairo manual](https://cairographics.org/manual/)

## 26. Dépannage

### `Cannot find module 'gi:Gtk-4.0'`

Le hook n'est pas chargé assez tôt :

```sh
node --import node-gtk/register dist/main.js
```

### Une classe n'existe pas dans TypeScript

Régénérez les types avec le bon typelib et vérifiez la version :

```sh
npx node-gtk list
npx node-gtk generate-types Gtk-4.0 Adw-1 cairo-1.0
```

### L'interface ne s'affiche pas

Vérifiez que :

- `app.run([])` est exécuté ;
- la fenêtre est attachée à l'application ;
- `window.present()` est appelé ;
- le widget racine est défini avec `setContent` ou `setChild` ;
- les bibliothèques GTK et Adwaita correspondent aux typelibs générés.

### Le dessin est vide

Vérifiez que :

- `setDrawFunc` est installé avant `queueDraw` ;
- la zone possède une taille (`contentWidth` et `contentHeight`) ;
- le contexte est utilisé uniquement dans le callback ;
- le chemin est rempli ou tracé ;
- `queueDraw()` est appelé après une modification d'état.

## 27. Validation et distribution

```sh
npm run typecheck
npm run build
node --import node-gtk/register dist/main.js
```

Pour un Flatpak ou un bundle portable, testez dans le runtime cible : les
versions de GTK et Adwaita du poste de développement ne sont pas
nécessairement celles du paquet distribué.

