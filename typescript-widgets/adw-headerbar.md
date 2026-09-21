# Adw.HeaderBar

**Bibliothèque :** Libadwaita  
**Import :** `import Adw from 'gi:Adw-1'`

![Capture d’écran de Adw.HeaderBar](./images/official/adw-headerbar.png)

## Description

Barre supérieure adaptative.

Cette page documente l'utilisation TypeScript avec node-gtk. Les types et les surcharges exactes sont générés depuis le typelib installé ; vérifiez toujours `node_modules/.node-gtk-types` pour votre version.

## Import et exemple minimal

```ts
import Adw from 'gi:Adw-1'
import Gio from 'gi:Gio-2.0'
import Gtk from 'gi:Gtk-4.0'

const header = new Adw.HeaderBar()
header.packStart(new Gtk.Button({ iconName: 'go-previous-symbolic' }))
```

## API principale

```ts
HeaderBar.packStart(widget: Gtk.Widget); packEnd(widget: Gtk.Widget); setTitleWidget(widget: Gtk.Widget | null); remove(widget: Gtk.Widget)
```

### Propriétés

- `titleWidget`
- `showStartTitleButtons`
- `showEndTitleButtons`
- `decorationLayout`

### Signaux

- Aucun signal principal documenté.

## Types associés

- `Gtk.Widget` et les classes parentes pour les widgets GTK.
- `Gio.ListModel`, `Gio.MenuModel` ou `Gio.Action` selon l'API.
- Les énumérations sont accessibles via l'espace de noms, par exemple `Adw.Orientation.VERTICAL` lorsque l'API le demande.

## Bonnes pratiques

- Utilisez les propriétés camelCase et les méthodes `get`/ `set` exposées par node-gtk.
- Connectez les signaux avec `on('nom-du-signal', callback)`.
- Ne conservez pas un contexte Cairo reçu dans un callback de dessin.
- Vérifiez la nullabilité et les signatures dans les déclarations générées.

## Références

- [Documentation GTK4](https://docs.gtk.org/gtk4/)
- [Documentation Libadwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/)
- [Guide API et exemples TypeScript](../typescript-gtk4-adwaita-cairo-api-examples.md)
