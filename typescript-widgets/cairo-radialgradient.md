# Cairo.RadialGradient

**Bibliothèque :** Cairo  
**Import :** `import Cairo from 'gi:cairo-1.0'`

![Capture d’écran de Cairo.RadialGradient](./screenshots/cairo-radialgradient.svg)

## Description

Dégradé radial.

Cairo est une API de dessin impérative. Dans GTK4, un `Cairo.Context` est généralement fourni par `Gtk.DrawingArea.setDrawFunc` et ne doit pas être conservé après le callback.

## Exemple TypeScript

```ts
import Cairo from 'gi:cairo-1.0'

const gradient = new Cairo.RadialGradient(100, 100, 10, 100, 100, 120)
gradient.addColorStopRgb(0, 1, 1, 1)
```

## API principale

```ts
Cairo.RadialGradient.new RadialGradient(cx0: number, cy0: number, radius0: number, cx1: number, cy1: number, radius1: number); addColorStopRgba(...)
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
