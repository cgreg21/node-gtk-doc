# Référence TypeScript : GTK4, Adwaita, Cairo et widgets

Ce document complète le [guide TypeScript GTK4, Adwaita et Cairo](./typescript-gtk4-adwaita-cairo.md).
Il réunit les widgets GTK4 et Adwaita couramment disponibles, leurs rôles et
les idiomes TypeScript correspondants.

> **Versions.** La liste exacte dépend de la version des typelibs installés.
> Les classes ajoutées dans une version récente de GTK ou d'Adwaita ne sont
> pas disponibles sur un runtime plus ancien. La commande
> `generate-types` reste la source de vérité pour votre machine.

## 1. Générer les types

```sh
npx node-gtk generate-types Gtk-4.0 Adw-1 cairo-1.0
```

```ts
import Adw from 'gi:Adw-1'
import Cairo from 'gi:cairo-1.0'
import Gtk from 'gi:Gtk-4.0'
```

Lancez ensuite l'application avec :

```sh
node --import node-gtk/register dist/main.js
```

Les membres sont lus depuis l'espace de noms par défaut. Les imports nommés
comme `import { Button } from 'gi:Gtk-4.0'` ne sont pas pris en charge.

## 2. Hiérarchie et conteneurs GTK4

Tous les widgets GTK héritent de `Gtk.Widget`. Un conteneur accepte ses enfants
avec une méthode propre à sa classe (`append`, `setChild`, `setStartChild`,
`setEndChild`, etc.).

| Classe | Utilisation |
| --- | --- |
| `Gtk.Widget` | Base de tous les widgets ; taille, visibilité, alignement, marges, CSS et signaux. |
| `Gtk.Window` | Fenêtre native générique. |
| `Gtk.ApplicationWindow` | Fenêtre attachée à `Gtk.Application`. |
| `Gtk.Box` | Colonne ou ligne avec `orientation` et `spacing`. |
| `Gtk.CenterBox` | Un enfant au début, un au centre et un à la fin. |
| `Gtk.Grid` | Disposition en lignes et colonnes. |
| `Gtk.Fixed` | Positionnement explicite ; à réserver aux interfaces qui l'exigent. |
| `Gtk.Overlay` | Superpose plusieurs enfants. |
| `Gtk.Paned` | Deux panneaux redimensionnables. |
| `Gtk.Stack` | Une seule page visible à la fois. |
| `Gtk.StackSwitcher` | Sélecteur visuel lié à un `Gtk.Stack`. |
| `Gtk.StackSidebar` | Navigation latérale liée à un `Gtk.Stack`. |
| `Gtk.ScrolledWindow` | Défilement autour d'un enfant. |
| `Gtk.Viewport` | Rend un enfant défilable lorsqu'il ne gère pas lui-même le défilement. |
| `Gtk.Frame` | Encadre un enfant avec un éventuel label. |
| `Gtk.Expander` | Affiche ou masque un enfant. |
| `Gtk.Revealer` | Anime l'apparition et la disparition d'un enfant. |
| `Gtk.Separator` | Séparateur horizontal ou vertical. |
| `Gtk.AspectFrame` | Conserve un rapport largeur/hauteur. |
| `Gtk.ConstraintLayout` | Disposition basée sur des contraintes. |

Exemple de composition :

```ts
const root = new Gtk.Box({
  orientation: Gtk.Orientation.VERTICAL,
  spacing: 12,
  marginTop: 12,
  marginBottom: 12,
  marginStart: 12,
  marginEnd: 12
})

const scroller = new Gtk.ScrolledWindow({ vexpand: true })
const content = new Gtk.Box({
  orientation: Gtk.Orientation.VERTICAL,
  spacing: 8
})

scroller.setChild(content)
root.append(scroller)
```

## 3. Texte, boutons et actions

| Classe | Utilisation |
| --- | --- |
| `Gtk.Label` | Texte statique ou avec mise en forme Pango. |
| `Gtk.Entry` | Champ texte sur une ligne. |
| `Gtk.PasswordEntry` | Champ texte masqué. |
| `Gtk.SearchEntry` | Champ de recherche avec interactions adaptées. |
| `Gtk.Text` | Champ texte simple moderne. |
| `Gtk.TextView` | Édition de texte multiligne avec `Gtk.TextBuffer`. |
| `Gtk.Button` | Action simple, avec label, icône ou enfant. |
| `Gtk.ToggleButton` | Bouton avec état activé/désactivé. |
| `Gtk.CheckButton` | Case à cocher ou bouton radio via `group`. |
| `Gtk.LinkButton` | Lien ouvrant une URI. |
| `Gtk.MenuButton` | Bouton qui affiche un menu ou un popover. |
| `Gtk.ShortcutsShortcut` | Raccourci affiché dans l'aide des raccourcis. |

```ts
const name = new Gtk.Entry({ placeholderText: 'Votre nom' })
const accept = new Gtk.CheckButton({ label: 'J’accepte', active: false })
const save = new Gtk.Button({
  label: 'Enregistrer',
  cssClasses: ['suggested-action']
})

save.on('clicked', () => {
  console.log(name.getText(), accept.getActive())
})
```

Les classes CSS peuvent aussi être ajoutées après construction :

```ts
save.addCssClass('suggested-action')
save.removeCssClass('destructive-action')
```

## 4. Contrôles et indicateurs

| Classe | Utilisation |
| --- | --- |
| `Gtk.Switch` | Interrupteur booléen. |
| `Gtk.Scale` | Curseur continu. |
| `Gtk.SpinButton` | Valeur numérique avec boutons d'incrément. |
| `Gtk.ProgressBar` | Progression déterminée ou indéterminée. |
| `Gtk.LevelBar` | Niveau ou jauge. |
| `Gtk.Spinner` | Indicateur d'activité indéterminée. |
| `Gtk.DropDown` | Choix dans un modèle défilant. |
| `Gtk.ComboBox` | Choix compatible avec les anciens modèles GTK. |
| `Gtk.ColorDialogButton` | Sélection d'une couleur. |
| `Gtk.FontDialogButton` | Sélection d'une police. |
| `Gtk.Calendar` | Calendrier et sélection de date. |
| `Gtk.ScaleButton` | Bouton affichant un curseur dans un popover. |

```ts
const volume = new Gtk.Scale({
  orientation: Gtk.Orientation.HORIZONTAL,
  hexpand: true
})
volume.setRange(0, 100)
volume.setValue(50)
volume.on('value-changed', () => {
  console.log(`Volume : ${volume.getValue()} %`)
})

const busy = new Gtk.Spinner({ spinning: true })
const progress = new Gtk.ProgressBar({ fraction: 0.4, showText: true })
```

## 5. Listes, modèles et vues

GTK4 sépare le modèle de données (`GListModel`) de la vue. Pour des listes
importantes, préférez `Gtk.ListView` ou `Gtk.GridView` à la création manuelle
d'un widget par ligne.

| Classe | Utilisation |
| --- | --- |
| `Gtk.ListView` | Liste verticale ou horizontale virtualisée. |
| `Gtk.GridView` | Grille virtualisée. |
| `Gtk.ColumnView` | Tableau de colonnes avec tri et redimensionnement. |
| `Gtk.TreeView` | Vue arborescente historique ; à utiliser seulement si nécessaire. |
| `Gtk.FlowBox` | Flux de widgets enfants. |
| `Gtk.ListBox` | Liste de widgets enfants, pratique pour de petites listes. |
| `Gtk.StringList` | Modèle simple de chaînes. |
| `Gtk.StringFilter` | Filtre textuel sur un modèle. |
| `Gtk.NumericSorter` | Tri numérique. |
| `Gtk.StringSorter` | Tri lexical. |
| `Gtk.SortListModel` | Modèle trié à partir d'un autre modèle. |
| `Gtk.FilterListModel` | Modèle filtré à partir d'un autre modèle. |
| `Gtk.SingleSelection` | Sélection unique. |
| `Gtk.MultiSelection` | Sélection multiple. |

Pour un menu déroulant simple :

```ts
const model = Gtk.StringList.new(['Bas', 'Moyen', 'Élevé'])
const dropdown = new Gtk.DropDown({ model })

dropdown.on('notify::selected', () => {
  const selected = dropdown.getSelected()
  console.log(selected, model.getString(selected))
})
```

## 6. Images, icônes et dessin

| Classe | Utilisation |
| --- | --- |
| `Gtk.Image` | Image depuis une icône, un fichier ou un `Gdk.Paintable`. |
| `Gtk.Picture` | Affichage d'un `Gdk.Paintable`, avec contrôle du contenu. |
| `Gtk.DrawingArea` | Zone de dessin avec un callback Cairo. |
| `Gtk.IconView` | Vue d'icônes basée sur un modèle. |
| `Gtk.MediaFile` | Source média pour `Gtk.Video`. |
| `Gtk.Video` | Lecture vidéo. |

```ts
const icon = new Gtk.Image({ iconName: 'document-open-symbolic' })
const drawing = new Gtk.DrawingArea({
  contentWidth: 320,
  contentHeight: 180
})

drawing.setDrawFunc((_area, cr, width, height) => {
  cr.setSourceRgb(0.1, 0.12, 0.18)
  cr.rectangle(0, 0, width, height)
  cr.fill()
})
```

### Cairo

Cairo n'est pas un widget. Il fournit le contexte et les surfaces de dessin :

| Type | Utilisation |
| --- | --- |
| `Cairo.Context` | Transformations, chemins, couleurs, texte et peinture. |
| `Cairo.Surface` | Surface abstraite de rendu. |
| `Cairo.ImageSurface` | Surface image en mémoire ou dans un fichier. |
| `Cairo.PdfSurface` | Génération PDF. |
| `Cairo.SvgSurface` | Génération SVG. |
| `Cairo.RecordingSurface` | Enregistrement de commandes de dessin. |
| `Cairo.Matrix` | Transformation affine. |
| `Cairo.Pattern` | Motif, dégradé ou surface répétée. |

Le contexte reçu par `Gtk.DrawingArea.setDrawFunc` appartient à GTK. Utilisez
ses méthodes pendant le callback et ne le conservez pas après son retour.

## 7. Menus, popovers, dialogues et sélection

| Classe | Utilisation |
| --- | --- |
| `Gtk.Popover` | Contenu flottant attaché à un widget. |
| `Gtk.PopoverMenu` | Menu basé sur `Gio.MenuModel`. |
| `Gtk.PopoverMenuBar` | Barre de menus basée sur un modèle. |
| `Gtk.AlertDialog` | Dialogue d'alerte asynchrone. |
| `Gtk.FileDialog` | Sélection de fichier ou de dossier. |
| `Gtk.ColorDialog` | Sélection de couleur. |
| `Gtk.FontDialog` | Sélection de police. |
| `Gtk.PrintDialog` | Impression et export PDF. |
| `Gtk.FileChooserWidget` | Sélecteur intégré dans une interface. |
| `Gtk.FileChooserDialog` | Sélecteur de fichiers de compatibilité. |
| `Gtk.PlacesSidebar` | Emplacements du système de fichiers. |
| `Gtk.RecentManager` | Gestion des fichiers récents. |

Les dialogues modernes sont généralement asynchrones. Vérifiez la signature
générée par votre version de GTK et attendez le résultat avec `Promise` lorsque
le binding expose une opération async.

## 8. Widgets Adwaita

Adwaita ajoute les composants et les comportements visuels recommandés pour
les applications GNOME. Les classes sont importées depuis `gi:Adw-1`.

### Fenêtres et barres d'outils

| Classe | Utilisation |
| --- | --- |
| `Adw.Application` | Application GNOME basée sur `Gtk.Application`. |
| `Adw.ApplicationWindow` | Fenêtre principale Adwaita. |
| `Adw.HeaderBar` | Barre supérieure adaptative. |
| `Adw.ToolbarView` | Contenu entouré de barres d'outils. |
| `Adw.ViewStack` | Pages empilées avec titre et icône. |
| `Adw.ViewSwitcher` | Sélecteur lié à un `Adw.ViewStack`. |
| `Adw.ViewSwitcherBar` | Sélecteur adapté aux fenêtres étroites. |
| `Adw.NavigationView` | Navigation par pages avec historique. |
| `Adw.NavigationPage` | Page dans un `Adw.NavigationView`. |
| `Adw.NavigationSplitView` | Deux panneaux de navigation adaptatifs. |

```ts
const stack = new Adw.ViewStack({ vexpand: true })
stack.addTitled(new Gtk.Label({ label: 'Accueil' }), 'home', 'Accueil')
stack.addTitled(new Gtk.Label({ label: 'Réglages' }), 'settings', 'Réglages')

const switcher = new Adw.ViewSwitcher({ stack })
const header = new Adw.HeaderBar({ titleWidget: switcher })

const view = new Adw.ToolbarView()
view.addTopBar(header)
view.setContent(stack)
```

### Mise en page adaptative

| Classe | Utilisation |
| --- | --- |
| `Adw.Clamp` | Limite la largeur maximale du contenu. |
| `Adw.ClampScrollable` | Version adaptée à un enfant défilable. |
| `Adw.Bin` | Conteneur à enfant unique. |
| `Adw.Flap` | Panneau latéral qui se replie. |
| `Adw.Leaflet` | Pages qui passent d'une disposition côte à côte à empilée. |
| `Adw.Squeezer` | Affiche un seul enfant selon l'espace disponible. |
| `Adw.WrapBox` | Flux adaptatif de widgets. |
| `Adw.MultiLayoutView` | Plusieurs layouts sélectionnés selon la taille. |

### Préférences et lignes

| Classe | Utilisation |
| --- | --- |
| `Adw.PreferencesPage` | Page de préférences. |
| `Adw.PreferencesGroup` | Groupe de préférences. |
| `Adw.PreferencesRow` | Ligne de base pour les préférences. |
| `Adw.ActionRow` | Ligne avec titre, sous-titre, préfixes et suffixes. |
| `Adw.EntryRow` | Ligne contenant un champ texte. |
| `Adw.PasswordEntryRow` | Ligne contenant un champ mot de passe. |
| `Adw.ComboRow` | Ligne avec une liste déroulante. |
| `Adw.SpinRow` | Ligne avec une valeur numérique. |
| `Adw.SwitchRow` | Ligne avec un interrupteur. |
| `Adw.ExpanderRow` | Ligne contenant des lignes enfants extensibles. |

```ts
const group = new Adw.PreferencesGroup({ title: 'Compte' })
group.add(new Adw.EntryRow({ title: 'Nom d’utilisateur' }))
group.add(new Adw.PasswordEntryRow({ title: 'Mot de passe' }))
group.add(new Adw.SwitchRow({
  title: 'Notifications',
  subtitle: 'Recevoir les alertes',
  active: true
}))

const page = new Adw.PreferencesPage()
page.add(group)
```

### Retour utilisateur et contenu

| Classe | Utilisation |
| --- | --- |
| `Adw.ToastOverlay` | Zone qui affiche des notifications temporaires. |
| `Adw.Toast` | Notification temporaire avec action possible. |
| `Adw.Banner` | Bandeau d'information rétractable. |
| `Adw.StatusPage` | État vide, erreur ou écran d'accueil. |
| `Adw.Avatar` | Avatar avec image ou initiales. |
| `Adw.Carousel` | Pages défilables horizontalement. |
| `Adw.CarouselIndicatorDots` | Indicateurs de pages sous forme de points. |
| `Adw.CarouselIndicatorLines` | Indicateurs de pages sous forme de lignes. |
| `Adw.TabView` | Onglets avec pages et sélection. |
| `Adw.TabBar` | Barre d'onglets liée à un `Adw.TabView`. |
| `Adw.TabOverview` | Vue d'ensemble des onglets. |
| `Adw.SplitButton` | Bouton principal avec menu secondaire. |
| `Adw.ToggleGroup` | Groupe de boutons bascule exclusifs ou multiples. |
| `Adw.AlertDialog` | Dialogue d'alerte avec réponses nommées. |
| `Adw.AboutDialog` | Dialogue standard de présentation de l'application. |

```ts
const overlay = new Adw.ToastOverlay()
const button = new Gtk.Button({ label: 'Afficher' })
button.on('clicked', () => {
  overlay.addToast(new Adw.Toast({ title: 'Opération terminée' }))
})
overlay.setChild(button)
```

## 9. Modèles de données et signaux

Les widgets GTK4 utilisent fréquemment `Gio.ListModel` et des objets GObject.
Les signaux sont attachés avec `on` :

```ts
const switchWidget = new Gtk.Switch({ active: false })
switchWidget.on('notify::active', () => {
  console.log(switchWidget.getActive())
})

const entry = new Adw.EntryRow({ title: 'Recherche' })
entry.on('changed', () => {
  console.log(entry.getText())
})
```

Les propriétés de constructeur et les noms de méthodes sont camelCase dans
node-gtk. Les noms de signaux conservent la forme GTK en `dash-case`.

## 10. Obtenir la liste exacte des classes installées

La documentation ci-dessus couvre les widgets publics GTK4 et Adwaita les plus
utilisés. Pour l'inventaire complet de votre installation, générez les types :

```sh
npx node-gtk generate-types Gtk-4.0 Adw-1 cairo-1.0
```

Puis recherchez les déclarations `class` dans :

```text
node_modules/.node-gtk-types/
```

Vous pouvez aussi consulter les références officielles :

- [GTK4 — classes et widgets](https://docs.gtk.org/gtk4/)
- [GTK4 — galerie visuelle](https://docs.gtk.org/gtk4/visual_index.html)
- [Libadwaita — référence](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/)
- [Libadwaita — galerie de widgets](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/widget-gallery.html)
- [Cairo — manuel](https://cairographics.org/manual/)

## 11. Règles TypeScript importantes

### Propriétés et méthodes

Les propriétés de constructeur utilisent le `lowerCamelCase` de node-gtk :

```ts
const box = new Gtk.Box({
  orientation: Gtk.Orientation.HORIZONTAL,
  spacing: 8,
  hexpand: true,
  marginTop: 6
})
```

Une propriété peut aussi être manipulée avec ses méthodes `get`/`set` :

```ts
box.setSpacing(12)
box.setHexpand(true)
console.log(box.getSpacing())
```

Les fichiers `.gir` peuvent exposer des noms qui ne sont pas disponibles dans
une version antérieure de la bibliothèque. Ne recopiez pas une signature
depuis une documentation GTK plus récente sans vérifier les déclarations
générées localement.

### Signaux

Les signaux sont connectés par `on`. Un gestionnaire doit retourner le type
attendu par le signal :

```ts
const button = new Gtk.Button({ label: 'Fermer' })

button.on('clicked', () => {
  console.log('clic')
})

button.on('notify::label', () => {
  console.log(button.getLabel())
})

button.on('close-request', (): boolean => false)
```

Pour éviter de garder des références inutiles, conservez le résultat de la
connexion lorsque la version générée le fournit et déconnectez le signal
lorsque l'objet propriétaire disparaît. Les gestionnaires doivent éviter de
faire du travail lourd ; utilisez un idle GLib, un timer ou une promesse pour
reporter ce travail.

### Héritage et widgets personnalisés

Une classe TypeScript peut étendre un GObject introspecté. Les méthodes
virtuelles doivent utiliser le préfixe `virtual_` :

```ts
import Gtk from 'gi:Gtk-4.0'
import Gdk from 'gi:Gdk-4.0'
import Graphene from 'gi:Graphene-1.0'

class ColorWidget extends Gtk.Widget {
  virtual_snapshot(snapshot: Gtk.Snapshot): void {
    const width = this.getAllocatedWidth()
    const color = Gdk.RGBA.create('#3584e4')
    const rect = Graphene.Rect.create(0, 0, width, 8)
    snapshot.appendColor(color, rect)
  }
}

const widget = new ColorWidget()
```

Utilisez `registerClass` seulement si le GType doit exister avant la première
instance (par exemple pour un template GtkBuilder ou une propriété GObject).

## 12. Accessibilité, focus et clavier

GTK4 fournit les propriétés et rôles accessibles au niveau de
`Gtk.Accessible`. Une interface utilisable au clavier doit définir un ordre
de focus logique et ne pas transmettre l'information uniquement par la
couleur.

| Classe ou API | Usage |
| --- | --- |
| `Gtk.Accessible` | Rôle et états accessibles d'un widget. |
| `Gtk.AccessibleRole` | Rôle sémantique, par exemple `BUTTON` ou `CHECKBOX`. |
| `Gtk.EventControllerKey` | Touches clavier sur un widget. |
| `Gtk.EventControllerFocus` | Entrée et sortie du focus. |
| `Gtk.EventControllerMotion` | Mouvement du pointeur. |
| `Gtk.GestureClick` | Clics et appuis. |
| `Gtk.GestureDrag` | Glisser-déposer gestuel. |
| `Gtk.GestureLongPress` | Appui long. |
| `Gtk.ShortcutController` | Raccourcis clavier déclaratifs. |
| `Gtk.Shortcut` | Association d'un trigger et d'une action. |
| `Gtk.KeyvalTrigger` | Déclencheur pour une touche. |

```ts
const controller = new Gtk.EventControllerKey()
controller.on('key-pressed', (_keyval, _keycode, _state): boolean => {
  return false
})
button.addController(controller)
```

Adwaita fournit également des classes spécialisées pour la navigation, les
onglets et les préférences. Elles doivent être préférées aux conteneurs
génériques lorsque l'interface suit le modèle GNOME.

## 13. Actions, menus et raccourcis

Une application GTK utilise généralement `Gio.SimpleAction` et
`Gio.Menu` plutôt que des callbacks dispersés dans tous les boutons :

```ts
import Gio from 'gi:Gio-2.0'

const action = new Gio.SimpleAction('about')
action.on('activate', () => {
  console.log('À propos')
})
app.addAction(action)

const menu = new Gio.Menu()
menu.append('À propos', 'app.about')
const menuButton = new Gtk.MenuButton({ label: 'Menu' })
menuButton.setMenuModel(menu)
```

Classes GTK liées aux menus :

| Classe | Usage |
| --- | --- |
| `Gtk.PopoverMenu` | Menu contextuel ou menu de bouton. |
| `Gtk.PopoverMenuBar` | Barre de menus d'une fenêtre. |
| `Gtk.MenuButton` | Point d'entrée vers un `Gio.MenuModel`. |
| `Gtk.ModelButton` | Bouton généré par un menu. |
| `Gtk.ShortcutsWindow` | Fenêtre d'aide des raccourcis. |
| `Gtk.ShortcutsSection` | Groupe de raccourcis. |
| `Gtk.ShortcutsGroup` | Sous-groupe de raccourcis. |

## 14. Drag-and-drop et contrôleurs d'événements

GTK4 utilise `Gtk.DropTarget` et `Gtk.DragSource`. Les objets sont associés
au widget avec `addController` :

```ts
const dropTarget = new Gtk.DropTarget({
  actions: Gdk.DragAction.COPY,
  formats: Gdk.ContentFormats.new(['text/plain'])
})

dropTarget.on('drop', (value, _x, _y): boolean => {
  if (typeof value === 'string') {
    console.log(value)
    return true
  }
  return false
})

dropTarget.on('enter', () => Gdk.DragAction.COPY)
textView.addController(dropTarget)
```

Les classes utiles sont `Gtk.DropTarget`, `Gtk.DropControllerMotion`,
`Gtk.DragSource`, `Gtk.DragIcon` et `Gtk.DragSource`. Les types réellement
acceptés dépendent du `Gdk.ContentFormats` configuré.

## 15. CSS GTK et thèmes Adwaita

Le CSS GTK n'est pas un navigateur CSS complet. Il cible les widgets et leurs
classes de style :

```ts
const provider = new Gtk.CssProvider()
provider.loadFromData(`
  .demo-card {
    padding: 12px;
    border-radius: 12px;
    background: @card_bg_color;
  }
`)

Gtk.StyleContext.addProviderForDisplay(
  Gdk.Display.getDefault(),
  provider,
  Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
)
```

Pour une application Adwaita, utilisez les classes documentées par Adwaita :

```ts
const card = new Gtk.Box({ cssClasses: ['card'] })
const destructive = new Gtk.Button({
  label: 'Supprimer',
  cssClasses: ['destructive-action']
})
const suggested = new Gtk.Button({
  label: 'Continuer',
  cssClasses: ['suggested-action']
})
```

Les classes fréquentes sont `card`, `boxed-list`, `pill`, `circular`,
`flat`, `suggested-action`, `destructive-action`, `dim-label`,
`title-1` à `title-4`, `heading` et `caption`.

## 16. Gdk et Graphene nécessaires autour de GTK

Même lorsque le guide cible GTK4, certains types auxiliaires viennent de Gdk
ou Graphene :

```sh
npx node-gtk generate-types Gtk-4.0 Adw-1 cairo-1.0 Gdk-4.0 Graphene-1.0
```

| Espace de noms | Types courants |
| --- | --- |
| `Gdk` | `RGBA`, `Display`, `Texture`, `Paintable`, `ContentFormats`, `DragAction`. |
| `Graphene` | `Point`, `Rect`, `Size`, `Matrix`, `Vec2`, `Vec3`. |
| `Gio` | `ListModel`, `ListStore`, `SimpleAction`, `Menu`, `File`. |
| `Pango` | `FontDescription`, `AttrList`, `Layout`, `WrapMode`. |
| `GdkPixbuf` | Chargement et transformation d'images bitmap. |

## 17. Cairo en détail

### Cycle de dessin

Un dessin Cairo suit généralement ce cycle :

1. sauvegarder l'état avec `save()` si des transformations locales sont nécessaires ;
2. appliquer la transformation avec `translate`, `scale` ou `rotate` ;
3. construire un chemin avec `moveTo`, `lineTo`, `curveTo`, `rectangle` ou `arc` ;
4. définir une source avec `setSourceRgb`, `setSourceRgba` ou `setSource` ;
5. remplir ou tracer avec `fill`, `fillPreserve`, `stroke` ou `strokePreserve` ;
6. restaurer l'état avec `restore()`.

```ts
drawing.setDrawFunc((_area, cr, width, height) => {
  cr.save()
  cr.translate(width / 2, height / 2)
  cr.rotate(Math.PI / 8)
  cr.setSourceRgba(0.2, 0.5, 0.9, 0.85)
  cr.rectangle(-60, -30, 120, 60)
  cr.fill()
  cr.restore()
})
```

### Texte avec Pango

Pour le texte riche et l'alignement, utilisez Pango plutôt que de calculer
manuellement les dimensions avec Cairo :

```ts
import Pango from 'gi:Pango-1.0'

drawing.setDrawFunc((_area, cr, width, _height) => {
  const layout = Pango.cairoCreateLayout(cr)
  layout.setWidth(width * Pango.SCALE)
  layout.setText('Texte centré', -1)
  layout.setAlignment(Pango.Alignment.CENTER)
  Pango.cairoShowLayout(cr, layout)
})
```

Les noms exacts des fonctions d'intégration Pango/Cairo peuvent varier selon
la version du typelib. Vérifiez `Pango-1.0` dans les types générés.

### Exporter un document Cairo

```ts
const surface = new Cairo.PdfSurface('rapport.pdf', 595, 842)
const cr = new Cairo.Context(surface)
cr.setSourceRgb(0, 0, 0)
cr.moveTo(72, 72)
cr.showText('Rapport')
cr.showPage()
surface.finish()
```

Pour un SVG, remplacez `PdfSurface` par `SvgSurface`. Pour une image bitmap,
utilisez `ImageSurface` et `surface.writeToPng('image.png')` lorsque cette
méthode est disponible dans le typelib installé.

## 18. Listes virtualisées : recette complète

Une `Gtk.ListView` demande quatre éléments : un modèle, une factory, un
template d'objet et un binding. Le code ci-dessous illustre la structure ;
les signatures précises de `Gtk.SignalListItemFactory` doivent être confirmées
par les déclarations générées de votre version.

```ts
const model = Gio.ListStore.new(Gtk.StringObject.$gtype)
model.append(new Gtk.StringObject('Premier élément'))
model.append(new Gtk.StringObject('Deuxième élément'))

const selection = new Gtk.SingleSelection({ model })
const factory = new Gtk.SignalListItemFactory()

factory.on('setup', (_factory, listItem) => {
  listItem.setChild(new Gtk.Label({ xalign: 0 }))
})

factory.on('bind', (_factory, listItem) => {
  const label = listItem.getChild() as Gtk.Label
  const item = listItem.getItem() as Gtk.StringObject
  label.setLabel(item.getString())
})

const list = new Gtk.ListView({ model: selection, factory })
```

Si une factory est trop complexe, utilisez `Gtk.ListBox` pour quelques
dizaines de lignes et construisez directement chaque `Gtk.ListBoxRow`.

## 19. Checklist de production

- Fixer les versions GTK et Adwaita testées dans la documentation du projet.
- Régénérer les typages sur la machine de build, pas seulement sur le poste
  de développement.
- Tester l'application avec `NODE_ENV=development` puis en production.
- Vérifier les tailles étroites avec `Adw.Clamp`, `Adw.Leaflet`,
  `Adw.NavigationSplitView` ou `Adw.Squeezer`.
- Fournir un état vide avec `Adw.StatusPage` au lieu d'une zone blanche.
- Ajouter des labels, des raccourcis et un ordre de focus accessibles.
- Ne jamais conserver un contexte Cairo fourni à `setDrawFunc`.
- Appeler `queueDraw()` après chaque changement d'état qui affecte le rendu.
- Préférer les modèles virtualisés pour les grandes listes.
- Vérifier les erreurs de compilation TypeScript avant de tester le runtime :

```sh
npx tsc --noEmit
```

## 20. Inventaire étendu des classes GTK4

Cette section regroupe les classes GTK4 par domaine. Certaines sont des
contrôleurs, des modèles ou des dialogues plutôt que des widgets visuels,
mais elles font partie de la boîte à outils TypeScript.

### Affichage et mise en page

`Gtk.ActionBar`, `Gtk.ApplicationWindow`, `Gtk.AspectFrame`, `Gtk.Box`,
`Gtk.CenterBox`, `Gtk.ConstraintLayout`, `Gtk.Fixed`, `Gtk.Frame`,
`Gtk.Grid`, `Gtk.HeaderBar`, `Gtk.Overlay`, `Gtk.Paned`, `Gtk.Revealer`,
`Gtk.ScrolledWindow`, `Gtk.SearchBar`, `Gtk.Separator`, `Gtk.Stack`,
`Gtk.StackSidebar`, `Gtk.StackSwitcher`, `Gtk.Viewport`, `Gtk.Widget`,
`Gtk.Window`.

### Texte et édition

`Gtk.Editable`, `Gtk.EditableLabel`, `Gtk.Entry`, `Gtk.Label`,
`Gtk.PasswordEntry`, `Gtk.SearchEntry`, `Gtk.Text`, `Gtk.TextBuffer`,
`Gtk.TextIter`, `Gtk.TextMark`, `Gtk.TextTag`, `Gtk.TextTagTable`,
`Gtk.TextView`.

### Boutons et commandes

`Gtk.Button`, `Gtk.CheckButton`, `Gtk.LinkButton`, `Gtk.MenuButton`,
`Gtk.ModelButton`, `Gtk.ScaleButton`, `Gtk.ToggleButton`, `Gtk.VolumeButton`.

### Valeurs, choix et indicateurs

`Gtk.Calendar`, `Gtk.ColorDialog`, `Gtk.ColorDialogButton`, `Gtk.DropDown`,
`Gtk.FontDialog`, `Gtk.FontDialogButton`, `Gtk.LevelBar`, `Gtk.ProgressBar`,
`Gtk.Scale`, `Gtk.Scrollbar`, `Gtk.SpinButton`, `Gtk.Spinner`, `Gtk.Switch`.

### Modèles et vues de données

`Gtk.ColumnView`, `Gtk.ColumnViewCell`, `Gtk.ColumnViewColumn`,
`Gtk.FilterListModel`, `Gtk.Filter`, `Gtk.FlowBox`,
`Gtk.GridView`, `Gtk.ListBase`, `Gtk.ListBox`, `Gtk.ListBoxRow`,
`Gtk.ListItem`, `Gtk.ListItemFactory`, `Gtk.ListView`, `Gtk.NoSelection`,
`Gtk.SingleSelection`, `Gtk.MultiSelection`, `Gtk.SortListModel`,
`Gtk.Sorter`, `Gtk.StringFilter`, `Gtk.StringList`, `Gtk.StringObject`,
`Gtk.StringSorter`, `Gtk.TreeExpander`.

### Images, médias et rendu

`Gtk.DrawingArea`, `Gtk.GLArea`, `Gtk.Image`, `Gtk.MediaControls`,
`Gtk.MediaFile`, `Gtk.Picture`, `Gtk.Video`.

### Menus, dialogues et impression

`Gtk.AlertDialog`, `Gtk.Dialog`, `Gtk.FileChooserWidget`,
`Gtk.FileDialog`, `Gtk.FileFilter`, `Gtk.FileLauncher`,
`Gtk.MessageDialog`, `Gtk.NativeDialog`, `Gtk.Popover`, `Gtk.PopoverMenu`,
`Gtk.PopoverMenuBar`, `Gtk.PrintDialog`, `Gtk.PrintOperation`,
`Gtk.PrintUnixDialog`, `Gtk.PlacesSidebar`, `Gtk.RecentManager`.

### Événements et raccourcis

`Gtk.DragIcon`, `Gtk.DragSource`, `Gtk.DropControllerMotion`,
`Gtk.DropTarget`, `Gtk.EventController`, `Gtk.EventControllerFocus`,
`Gtk.EventControllerKey`, `Gtk.EventControllerLegacy`,
`Gtk.EventControllerMotion`, `Gtk.EventControllerScroll`,
`Gtk.Gesture`, `Gtk.GestureClick`, `Gtk.GestureDrag`,
`Gtk.GestureLongPress`, `Gtk.Shortcut`,
`Gtk.ShortcutAction`, `Gtk.ShortcutController`, `Gtk.ShortcutTrigger`,
`Gtk.ShortcutsGroup`, `Gtk.ShortcutsSection`, `Gtk.ShortcutsShortcut`,
`Gtk.ShortcutsWindow`.

## 21. Inventaire étendu des classes Adwaita

### Fenêtres, navigation et barres

`Adw.Application`, `Adw.ApplicationWindow`, `Adw.HeaderBar`,
`Adw.ToolbarView`, `Adw.ViewStack`, `Adw.ViewSwitcher`,
`Adw.ViewSwitcherBar`, `Adw.NavigationPage`, `Adw.NavigationView`,
`Adw.NavigationSplitView`, `Adw.TabView`, `Adw.TabBar`, `Adw.TabButton`,
`Adw.TabOverview`, `Adw.WindowTitle`.

### Disposition adaptative

`Adw.Bin`, `Adw.Clamp`, `Adw.ClampLayout`, `Adw.ClampScrollable`,
`Adw.Flap`, `Adw.Leaflet`, `Adw.MultiLayoutView`, `Adw.OverlaySplitView`,
`Adw.Squeezer`, `Adw.WrapBox`.

### Préférences et formulaires

`Adw.PreferencesDialog`, `Adw.PreferencesPage`,
`Adw.PreferencesGroup`, `Adw.PreferencesRow`, `Adw.ActionRow`,
`Adw.ComboRow`, `Adw.EntryRow`, `Adw.ExpanderRow`,
`Adw.PasswordEntryRow`, `Adw.SpinRow`, `Adw.SwitchRow`.

### Messages et états

`Adw.AboutDialog`, `Adw.AlertDialog`, `Adw.Banner`, `Adw.Dialog`,
`Adw.MessageDialog`, `Adw.StatusPage`, `Adw.Toast`, `Adw.ToastOverlay`.

### Sélection, boutons et présentation

`Adw.Avatar`, `Adw.Carousel`, `Adw.CarouselIndicatorDots`,
`Adw.CarouselIndicatorLines`, `Adw.SplitButton`, `Adw.ToggleGroup`.

La disponibilité de `Adw.AlertDialog`, `Adw.BottomSheet`,
`Adw.MultiLayoutView`, `Adw.OverlaySplitView` et d'autres classes dépend
fortement de la version de libadwaita. Ne faites pas reposer le code sur une
classe absente du fichier de déclaration généré.

## 22. Vérifier une classe avant de l'utiliser

Pour vérifier une classe et ses membres, recherchez-la dans le cache généré :

```sh
find node_modules/.node-gtk-types -type f -print0 |
  xargs -0 grep -n "class Button\|class ActionRow"
```

Sous PowerShell :

```powershell
Get-ChildItem node_modules\.node-gtk-types -Recurse -Filter '*.d.ts' |
  Select-String -Pattern 'class Button|class ActionRow'
```

Si une classe n'est pas présente :

1. vérifiez le nom et la casse de l'espace de noms ;
2. vérifiez la version retournée par `npx node-gtk list` ;
3. régénérez les types avec les typelibs de développement ;
4. consultez la documentation de la version installée, et non celle de
   `main` ou d'une version future.

Cette procédure est indispensable pour une documentation réellement complète :
GTK4, Adwaita et Cairo évoluent indépendamment, et l'ensemble des classes
disponibles dépend du système de compilation et du runtime de déploiement.
