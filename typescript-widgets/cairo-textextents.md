# Cairo.TextExtents

**Bibliothèque :** Cairo  
**Import :** `import Cairo from 'gi:cairo-1.0'`

![Capture d’écran de Cairo.TextExtents](./screenshots/cairo-textextents.svg)

## Description

Dimensions calculées d’un texte Cairo.

Cairo est une API de dessin impérative. Dans GTK4, un `Cairo.Context` est généralement fourni par `Gtk.DrawingArea.setDrawFunc` et ne doit pas être conservé après le callback.

## Exemple TypeScript

```ts
import Cairo from 'gi:cairo-1.0'

const extents = cr.textExtents("Bonjour")
console.log(extents.width, extents.height)
```

## API principale

```ts
Cairo.TextExtents.getXAdvance(): number; getYAdvance(): number; getWidth(): number; getHeight(): number
```

### Propriétés et types

- `xBearing`
- `yBearing`
- `width`
- `height`
- `xAdvance`
- `yAdvance`

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
