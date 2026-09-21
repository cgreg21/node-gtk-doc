# 3. Maîtriser GObject, les propriétés et les signaux

## Construction et propriétés

La plupart des objets acceptent un objet de propriétés au constructeur :

```ts
const label = new Gtk.Label({
  label: 'Prêt',
  hexpand: true,
  halign: Gtk.Align.START,
})
```

Une propriété peut ensuite être lue ou affectée avec son nom TypeScript :

```ts
label.label = 'Traitement terminé'
label.visible = true
```

Les valeurs énumérées utilisent les constantes de leur espace de noms. Évitez
les nombres magiques : `Gtk.Orientation.VERTICAL` exprime l'intention et reste
vérifiable par TypeScript.

## Signaux

La méthode `on` connecte une fonction à un signal :

```ts
button.on('clicked', () => {
  label.label = 'Bouton activé'
})
```

Les signaux transportent parfois des arguments. Les types générés indiquent leur
ordre et leur nature. Limitez le travail réalisé dans le callback et déléguez la
logique métier à une fonction testable.

## Actions

Les actions Gio séparent l'intention de l'interface. Boutons, menus et raccourcis
peuvent activer la même action :

```ts
import Gio from 'gi:Gio-2.0'

const save = new Gio.SimpleAction({ name: 'save' })
save.on('activate', () => persistDocument())
app.addAction(save)
app.setAccelsForAction('app.save', ['<Primary>s'])
```

## Modèles et vues

Pour quelques éléments, `Gtk.ListBox` est simple. Pour des centaines ou milliers
d'éléments, utilisez un `Gio.ListStore`, une sélection et une vue virtualisée
(`Gtk.ListView`, `Gtk.GridView` ou `Gtk.ColumnView`). Une fabrique crée et lie
uniquement les lignes visibles.

## Mémoire

Les objets GObject et JavaScript ont des cycles de vie différents. Conservez les
références nécessaires à l'état de l'application, évitez les collections
globales qui retiennent indéfiniment les widgets et déconnectez les sources
temporisées lorsqu'une fenêtre disparaît.

## Concurrence

GTK n'est pas une API d'interface multithread. Les calculs lourds peuvent être
exécutés dans un worker Node.js ; appliquez ensuite le résultat depuis le thread
principal. Pour les fichiers et le réseau, préférez les opérations asynchrones.

## À lire ensuite

- [Gestion du ramasse-miettes des signaux](../signal-handler-gc.md)
- [Référence des widgets et modèles](../typescript-gtk4-adwaita-cairo-widgets.md)
- [Manuel API et exemples](../typescript-gtk4-adwaita-cairo-api-examples.md)

