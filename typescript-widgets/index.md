# Référence des widgets TypeScript

Chaque classe dispose d'un fichier Markdown unique avec sa description, un exemple TypeScript, son API principale, ses propriétés, ses signaux et les types associés.

## Générer les types

```sh
npx node-gtk generate-types Gtk-4.0 Adw-1 cairo-1.0 Gdk-4.0 Graphene-1.0 Gio-2.0 Pango-1.0
```

## Captures d’écran

Chaque fiche affiche une capture avant la description :

- **Widgets GTK4** : image officielle de la [galerie GTK4](https://docs.gtk.org/gtk4/visual_index.html).
- **Widgets Libadwaita** : image officielle de la [galerie Libadwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/widget-gallery.html).
- **Autres classes** (Cairo, classes abstraites, vues de listes) : aucune capture officielle n’existe, un schéma local dans `./screenshots/` est utilisé à la place.

Les captures officielles sont la propriété des projets GNOME/GTK et sont diffusées
sous licence LGPL-2.1-or-later. Elles sont copiées dans `./images/official/` et
référencées localement par les fichiers Markdown afin que la documentation et
l’EPUB restent disponibles hors ligne. La commande `npm run images:widgets`
permet de les télécharger depuis les documentations officielles.

- [Gtk.Widget](./gtk-widget.md) — Base de tous les widgets GTK4.
- [Gtk.Box](./gtk-box.md) — Conteneur linéaire horizontal ou vertical.
- [Gtk.CenterBox](./gtk-centerbox.md) — Conteneur avec enfant au début, au centre et à la fin.
- [Gtk.Grid](./gtk-grid.md) — Disposition en lignes et colonnes.
- [Gtk.Overlay](./gtk-overlay.md) — Superpose des widgets autour d’un enfant principal.
- [Gtk.ScrolledWindow](./gtk-scrolledwindow.md) — Ajoute le défilement à un enfant.
- [Gtk.Paned](./gtk-paned.md) — Deux panneaux redimensionnables.
- [Gtk.Stack](./gtk-stack.md) — Affiche une page parmi plusieurs.
- [Gtk.StackSwitcher](./gtk-stackswitcher.md) — Sélecteur visuel lié à un Gtk.Stack.
- [Gtk.StackSidebar](./gtk-stacksidebar.md) — Navigation latérale liée à un Gtk.Stack.
- [Gtk.Frame](./gtk-frame.md) — Encadre un enfant avec un label optionnel.
- [Gtk.Expander](./gtk-expander.md) — Affiche ou masque un enfant.
- [Gtk.Revealer](./gtk-revealer.md) — Anime l’apparition d’un enfant.
- [Gtk.Label](./gtk-label.md) — Affiche du texte.
- [Gtk.Entry](./gtk-entry.md) — Champ texte sur une ligne.
- [Gtk.PasswordEntry](./gtk-passwordentry.md) — Champ de mot de passe.
- [Gtk.SearchEntry](./gtk-searchentry.md) — Champ de recherche avec interaction dédiée.
- [Gtk.Text](./gtk-text.md) — Champ texte simple GTK4.
- [Gtk.TextView](./gtk-textview.md) — Éditeur multiligne basé sur Gtk.TextBuffer.
- [Gtk.Button](./gtk-button.md) — Déclenche une action.
- [Gtk.ToggleButton](./gtk-togglebutton.md) — Bouton avec état activé.
- [Gtk.CheckButton](./gtk-checkbutton.md) — Case à cocher ou bouton radio.
- [Gtk.LinkButton](./gtk-linkbutton.md) — Bouton ouvrant une URI.
- [Gtk.MenuButton](./gtk-menubutton.md) — Bouton affichant un menu ou un popover.
- [Gtk.Switch](./gtk-switch.md) — Interrupteur booléen.
- [Gtk.Scale](./gtk-scale.md) — Curseur numérique.
- [Gtk.SpinButton](./gtk-spinbutton.md) — Contrôle numérique incrémental.
- [Gtk.ProgressBar](./gtk-progressbar.md) — Indicateur de progression.
- [Gtk.LevelBar](./gtk-levelbar.md) — Jauge de niveau.
- [Gtk.Spinner](./gtk-spinner.md) — Indicateur d’activité indéterminée.
- [Gtk.DropDown](./gtk-dropdown.md) — Sélection dans un modèle.
- [Gtk.DrawingArea](./gtk-drawingarea.md) — Zone de dessin Cairo.
- [Gtk.Image](./gtk-image.md) — Affiche une icône ou une image.
- [Gtk.Picture](./gtk-picture.md) — Affiche un Gdk.Paintable.
- [Gtk.ListBox](./gtk-listbox.md) — Petite liste de widgets.
- [Gtk.ListView](./gtk-listview.md) — Liste virtualisée basée sur un modèle.
- [Gtk.GridView](./gtk-gridview.md) — Grille virtualisée.
- [Gtk.ColumnView](./gtk-columnview.md) — Tableau virtualisé à colonnes.
- [Gtk.FileDialog](./gtk-filedialog.md) — Sélecteur de fichiers asynchrone GTK4.
- [Gtk.AlertDialog](./gtk-alertdialog.md) — Dialogue d’alerte moderne.
- [Gtk.Popover](./gtk-popover.md) — Contenu flottant attaché à un widget.
- [Gtk.GLArea](./gtk-glarea.md) — Zone de rendu OpenGL.
- [Adw.Application](./adw-application.md) — Application GNOME basée sur Gtk.Application.
- [Adw.ApplicationWindow](./adw-applicationwindow.md) — Fenêtre principale Adwaita.
- [Adw.HeaderBar](./adw-headerbar.md) — Barre supérieure adaptative.
- [Adw.ToolbarView](./adw-toolbarview.md) — Conteneur de contenu et barres d’outils.
- [Adw.ViewStack](./adw-viewstack.md) — Pile de pages Adwaita.
- [Adw.ViewSwitcher](./adw-viewswitcher.md) — Sélecteur adaptatif de ViewStack.
- [Adw.ViewSwitcherBar](./adw-viewswitcherbar.md) — Sélecteur inférieur pour fenêtres étroites.
- [Adw.Clamp](./adw-clamp.md) — Limite la largeur du contenu.
- [Adw.Leaflet](./adw-leaflet.md) — Disposition qui passe de côte à côte à empilée.
- [Adw.Flap](./adw-flap.md) — Panneau latéral adaptatif.
- [Adw.NavigationView](./adw-navigationview.md) — Navigation avec historique de pages.
- [Adw.NavigationPage](./adw-navigationpage.md) — Page enfant d’un NavigationView.
- [Adw.NavigationSplitView](./adw-navigationsplitview.md) — Deux panneaux de navigation adaptatifs.
- [Adw.PreferencesPage](./adw-preferencespage.md) — Page de préférences.
- [Adw.PreferencesGroup](./adw-preferencesgroup.md) — Groupe de lignes de préférences.
- [Adw.PreferencesRow](./adw-preferencesrow.md) — Ligne de base des préférences.
- [Adw.ActionRow](./adw-actionrow.md) — Ligne avec titre, sous-titre, préfixe et suffixe.
- [Adw.EntryRow](./adw-entryrow.md) — Ligne contenant un champ texte.
- [Adw.PasswordEntryRow](./adw-passwordentryrow.md) — Ligne contenant un mot de passe.
- [Adw.ComboRow](./adw-comborow.md) — Ligne avec sélection dans un modèle.
- [Adw.SpinRow](./adw-spinrow.md) — Ligne avec valeur numérique.
- [Adw.SwitchRow](./adw-switchrow.md) — Ligne avec interrupteur.
- [Adw.ExpanderRow](./adw-expanderrow.md) — Ligne extensible contenant d’autres lignes.
- [Adw.ToastOverlay](./adw-toastoverlay.md) — Affiche des notifications temporaires.
- [Adw.Toast](./adw-toast.md) — Notification temporaire avec action.
- [Adw.Banner](./adw-banner.md) — Bandeau rétractable d’information.
- [Adw.StatusPage](./adw-statuspage.md) — État vide, erreur ou écran d’accueil.
- [Adw.Avatar](./adw-avatar.md) — Avatar avec image ou initiales.
- [Adw.Carousel](./adw-carousel.md) — Pages défilables horizontalement.
- [Adw.SplitButton](./adw-splitbutton.md) — Bouton principal avec menu secondaire.
- [Adw.AboutDialog](./adw-aboutdialog.md) — Dialogue standard de présentation.

## Cairo

- [Cairo.Context](./cairo-context.md) — Contexte de dessin.
- [Cairo.Surface](./cairo-surface.md) — Surface abstraite de rendu.
- [Cairo.ImageSurface](./cairo-imagesurface.md) — Surface bitmap.
- [Cairo.PdfSurface](./cairo-pdfsurface.md) — Surface PDF.
- [Cairo.SvgSurface](./cairo-svgsurface.md) — Surface SVG.
- [Cairo.RecordingSurface](./cairo-recordingsurface.md) — Surface enregistrant les commandes.
- [Cairo.Pattern](./cairo-pattern.md) — Source de peinture abstraite.
- [Cairo.SolidPattern](./cairo-solidpattern.md) — Motif de couleur unie.
- [Cairo.LinearGradient](./cairo-lineargradient.md) — Dégradé linéaire.
- [Cairo.RadialGradient](./cairo-radialgradient.md) — Dégradé radial.
- [Cairo.Matrix](./cairo-matrix.md) — Transformation affine.
- [Cairo.Rectangle](./cairo-rectangle.md) — Rectangle géométrique.
- [Cairo.TextExtents](./cairo-textextents.md) — Dimensions de texte.
- [Cairo.FontExtents](./cairo-fontextents.md) — Métriques de police.
