# Gtk.Grid

**Bibliothèque :** GTK4  
**Import :** `import Gtk from 'gi:Gtk-4.0'`

![Capture d’écran de Gtk.Grid](./images/official/gtk-grid.png)

## Description

Disposition en lignes et colonnes.

Cette page documente l'utilisation TypeScript avec node-gtk. Les types et les surcharges exactes sont générés depuis le typelib installé ; vérifiez toujours `node_modules/.node-gtk-types` pour votre version.

## Import et exemple minimal

```ts
import Gtk from 'gi:Gtk-4.0'
import Gio from 'gi:Gio-2.0'

const grid = new Gtk.Grid({ rowSpacing: 8, columnSpacing: 8 })
grid.attach(new Gtk.Label({ label: 'Nom' }), 0, 0, 1, 1)
```

## API principale

```ts
Grid.attach(child: Gtk.Widget, column: number, row: number, width: number, height: number); attachNextTo(child: Gtk.Widget, sibling: Gtk.Widget, side: Gtk.PositionType, width: number, height: number); remove(child: Gtk.Widget)
```

### Propriétés

- `rowSpacing`
- `columnSpacing`
- `rowHomogeneous`
- `columnHomogeneous`

### Signaux

- Aucun signal principal documenté.

## Types associés

- `Gtk.Widget` et les classes parentes pour les widgets GTK.
- `Gio.ListModel`, `Gio.MenuModel` ou `Gio.Action` selon l'API.
- Les énumérations sont accessibles via l'espace de noms, par exemple `Gtk.Orientation.VERTICAL` lorsque l'API le demande.

## Bonnes pratiques

- Utilisez les propriétés camelCase et les méthodes `get`/ `set` exposées par node-gtk.
- Connectez les signaux avec `on('nom-du-signal', callback)`.
- Ne conservez pas un contexte Cairo reçu dans un callback de dessin.
- Vérifiez la nullabilité et les signatures dans les déclarations générées.

## Références

- [Documentation GTK4](https://docs.gtk.org/gtk4/)
- [Documentation Libadwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/)
- [Guide API et exemples TypeScript](../typescript-gtk4-adwaita-cairo-api-examples.md)
