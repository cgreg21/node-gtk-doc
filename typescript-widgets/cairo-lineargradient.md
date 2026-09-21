# Cairo.LinearGradient

**Bibliothèque :** Cairo  
**Import :** `import Cairo from 'gi:cairo-1.0'`

![Capture d’écran de Cairo.LinearGradient](./screenshots/cairo-lineargradient.svg)

## Description

Dégradé linéaire.

Cairo est une API de dessin impérative. Dans GTK4, un `Cairo.Context` est généralement fourni par `Gtk.DrawingArea.setDrawFunc` et ne doit pas être conservé après le callback.

## Exemple TypeScript

```ts
import Cairo from 'gi:cairo-1.0'

const gradient = new Cairo.LinearGradient(0, 0, 320, 0)
gradient.addColorStopRgba(0, 0.1, 0.2, 0.8, 1)
gradient.addColorStopRgba(1, 0.8, 0.9, 1, 1)
```

## API principale

```ts
Cairo.LinearGradient.new LinearGradient(x0: number, y0: number, x1: number, y1: number); addColorStopRgb(offset: number, red: number, green: number, blue: number); addColorStopRgba(...)
```

### Propriétés et types

- `stops`
- `extend`
- `filter`

### Signaux

- Les types Cairo ne possèdent pas de signaux GObject.

## Utilisation avec GTK4

```ts
import Gtk from 'gi:Gtk-4.0'

const area = new Gtk.DrawingArea({ contentWidth: 320, contentHeight: 180 })
area.setDrawFunc((_area, cr, width, height) => {
  cr.setSourceRgb(0.1, 0.1, 0.1)
  cr.rectangle(0, 0, width, height)
  cr.fill()
})
```

## Références

- [Cairo manual](https://cairographics.org/manual/)
- [Guide API TypeScript](../typescript-gtk4-adwaita-cairo-api-examples.md)
