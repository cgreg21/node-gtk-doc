# Documentation individuelle des classes GTK4, Adwaita et Cairo

Cette référence contient un fichier Markdown unique par classe documentée.
Chaque page fournit une description, un exemple TypeScript, l'API principale,
les propriétés, les signaux ou événements et les types associés.
Chaque fiche commence aussi par une capture illustrée SVG locale, utilisable
dans Markdown comme dans l'EPUB, avant sa description technique.

## Index complet

- [Index GTK4, Adwaita et Cairo](./typescript-widgets/index.md)
- [Guide API et exemples](./typescript-gtk4-adwaita-cairo-api-examples.md)
- [Référence détaillée des widgets](./typescript-gtk4-adwaita-cairo-widgets.md)

## Générer les déclarations TypeScript

```sh
npx node-gtk generate-types \
  Gtk-4.0 Adw-1 cairo-1.0 Gdk-4.0 Graphene-1.0 Gio-2.0 Pango-1.0
```

Les pages individuelles documentent les API courantes, mais les déclarations
générées localement restent l'autorité pour les versions installées :

```text
node_modules/.node-gtk-types/
```

Les classes GTK4 et Adwaita sont générées dans
[typescript-widgets/index.md](./typescript-widgets/index.md). Les types Cairo
individuels sont également listés ci-dessous :

## Cairo

- [Cairo.Context](./typescript-widgets/cairo-context.md)
- [Cairo.Surface](./typescript-widgets/cairo-surface.md)
- [Cairo.ImageSurface](./typescript-widgets/cairo-imagesurface.md)
- [Cairo.PdfSurface](./typescript-widgets/cairo-pdfsurface.md)
- [Cairo.SvgSurface](./typescript-widgets/cairo-svgsurface.md)
- [Cairo.RecordingSurface](./typescript-widgets/cairo-recordingsurface.md)
- [Cairo.Pattern](./typescript-widgets/cairo-pattern.md)
- [Cairo.SolidPattern](./typescript-widgets/cairo-solidpattern.md)
- [Cairo.LinearGradient](./typescript-widgets/cairo-lineargradient.md)
- [Cairo.RadialGradient](./typescript-widgets/cairo-radialgradient.md)
- [Cairo.Matrix](./typescript-widgets/cairo-matrix.md)
- [Cairo.Rectangle](./typescript-widgets/cairo-rectangle.md)
- [Cairo.TextExtents](./typescript-widgets/cairo-textextents.md)
- [Cairo.FontExtents](./typescript-widgets/cairo-fontextents.md)

## Vérifier une classe absente

```powershell
Get-ChildItem node_modules\.node-gtk-types -Recurse -Filter '*.d.ts' |
  Select-String -Pattern 'class Button|class Context|class PreferencesGroup'
```

Une classe absente doit être vérifiée avec `npx node-gtk list` et la version
du typelib installée. GTK4, libadwaita et Cairo évoluent indépendamment.
