# Adw.NavigationSplitView

**Bibliothèque :** Libadwaita  
**Import :** `import Adw from 'gi:Adw-1'`

![Capture d’écran de Adw.NavigationSplitView](./images/official/adw-navigationsplitview.png)

## Description

Deux panneaux de navigation adaptatifs.

Cette page documente l'utilisation TypeScript avec node-gtk. Les types et les surcharges exactes sont générés depuis le typelib installé ; vérifiez toujours `node_modules/.node-gtk-types` pour votre version.

## Import et exemple minimal

```ts
import Adw from 'gi:Adw-1'
import Gio from 'gi:Gio-2.0'

const split = new Adw.NavigationSplitView({ sidebar, content })
```

## API principale

```ts
NavigationSplitView.setSidebarPage(page: Adw.NavigationPage); setContentPage(page: Adw.NavigationPage); setShowContent(value: boolean)
```

### Propriétés

- `sidebar`
- `content`
- `collapsed`
- `showContent`
- `minSidebarWidth`
- `maxSidebarWidth`

### Signaux

- `notify::collapsed`

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
