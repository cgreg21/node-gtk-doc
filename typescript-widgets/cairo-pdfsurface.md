# Cairo.PdfSurface

**Bibliothèque :** Cairo  
**Import :** `import Cairo from 'gi:cairo-1.0'`

![Capture d’écran de Cairo.PdfSurface](./screenshots/cairo-pdfsurface.svg)

## Description

Surface destinée à la génération PDF.

Cairo est une API de dessin impérative. Dans GTK4, un `Cairo.Context` est généralement fourni par `Gtk.DrawingArea.setDrawFunc` et ne doit pas être conservé après le callback.

## Exemple TypeScript

```ts
import Cairo from 'gi:cairo-1.0'

const surface = new Cairo.PdfSurface("rapport.pdf", 595, 842)
const cr = new Cairo.Context(surface)
cr.showPage()
surface.finish()
```

## API principale

```ts
Cairo.PdfSurface.new PdfSurface(filename: string, width: number, height: number); setSize(width: number, height: number); restrictToVersion(version: Cairo.PdfVersion)
```

### Propriétés et types

- `fallbackResolution`
- `mimeData`

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
