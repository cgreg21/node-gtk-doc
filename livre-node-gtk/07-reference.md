# 7. Référence complète et parcours thématiques

Cette annexe relie l'ensemble de la documentation existante. Tous ces fichiers
sont inclus dans l'édition EPUB complète.

## Démarrage et infrastructure

- [Documentation générale](../index.md)
- [Importer les espaces de noms](../importing.md)
- [TypeScript et génération des types](../typescript.md)
- [Construction native](../building.md)
- [Bundles et Flatpak](../bundling.md)

## API node-gtk

- [API bas niveau](../api.md)
- [GObject Introspection](../gobject-introspection.md)
- [Fonctionnalités GIR prises en charge](../gir-features.md)
- [Remplacements et adaptations d'API](../overrides.md)
- [Cycle de vie des gestionnaires de signaux](../signal-handler-gc.md)
- [Styles GTK](../styles.md)

## GTK4, Libadwaita et Cairo

- [Guide pratique TypeScript](../typescript-gtk4-adwaita-cairo.md)
- [Widgets, modèles, événements et dessin](../typescript-gtk4-adwaita-cairo-widgets.md)
- [Manuel API et exemples](../typescript-gtk4-adwaita-cairo-api-examples.md)
- [Index des fiches individuelles](../typescript-widgets/index.md)

## Parcours par besoin

| Besoin | Point de départ |
|---|---|
| Fenêtres et navigation | `Adw.ApplicationWindow`, `Adw.NavigationView` |
| Formulaires | `Gtk.Entry`, `Gtk.DropDown`, `Adw.ActionRow` |
| Listes importantes | `Gio.ListStore`, `Gtk.ListView`, `Gtk.ColumnView` |
| Préférences | `Adw.PreferencesPage`, `Adw.SwitchRow`, `Adw.ComboRow` |
| Dessin personnalisé | `Gtk.DrawingArea`, `Cairo.Context` |
| Fichiers | `Gtk.FileDialog`, `Gio.File` |
| Notifications | `Adw.ToastOverlay`, `Adw.Toast` |
| Apparence | CSS GTK, classes de style Libadwaita |

## Fiches individuelles

L'[index des widgets](../typescript-widgets/index.md) donne accès à 87 fiches
individuelles. Chaque fiche contient une description, une capture ou illustration,
un exemple TypeScript, les principales méthodes, propriétés, signaux et types.

## Sources officielles

- [GTK4](https://docs.gtk.org/gtk4/)
- [Galerie GTK4](https://docs.gtk.org/gtk4/visual_index.html)
- [Libadwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/)
- [Galerie Libadwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/widget-gallery.html)
- [Cairo](https://www.cairographics.org/manual/)
- [GObject Introspection](https://gi.readthedocs.io/)

