# Cairo.Matrix

**Bibliothèque :** Cairo  
**Import :** `import Cairo from 'gi:cairo-1.0'`

![Capture d’écran de Cairo.Matrix](./screenshots/cairo-matrix.svg)

## Description

Transformation affine Cairo.

Cairo est une API de dessin impérative. Dans GTK4, un `Cairo.Context` est généralement fourni par `Gtk.DrawingArea.setDrawFunc` et ne doit pas être conservé après le callback.

## Exemple TypeScript

```ts
import Cairo from 'gi:cairo-1.0'

const matrix = new Cairo.Matrix()
matrix.translate(10, 20)
matrix.rotate(Math.PI / 4)
```

## API principale

```ts
Cairo.Matrix.initIdentity(); translate(tx: number, ty: number); scale(sx: number, sy: number); rotate(angle: number); invert(); multiply(other: Cairo.Matrix): Cairo.Matrix
```

### Propriétés et types

- `xx`
- `yx`
- `xy`
- `yy`
- `x0`
- `y0`

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
