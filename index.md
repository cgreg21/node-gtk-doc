# Documentation

**Note** : GTK et Adwaita sont des bibliothèques complémentaires : GTK est la couche de base, et
Adwaita est un ensemble de widgets et de thèmes construit sur GTK.

#### Table des matières
  1. [Importer](#importer)
  1. [Utiliser des bibliothèques](#utiliser-des-bibliothèques)
  1. [Widgets et style](#widgets-et-style)
  1. [Outils de développement](#outils-de-développement)
  1. [TypeScript](#typescript)
  1. [GTK4, Adwaita et Cairo avec TypeScript](./typescript-gtk4-adwaita-cairo.md)
  1. [Référence des widgets GTK4, Adwaita et Cairo](./typescript-gtk4-adwaita-cairo-widgets.md)
  1. [API et exemples TypeScript GTK4, Adwaita et Cairo](./typescript-gtk4-adwaita-cairo-api-examples.md)
  1. [Documentation individuelle des classes GTK4, Adwaita et Cairo](./typescript-widgets.md)
  1. [Livre complet : développer des applications GNOME avec TypeScript](./livre-node-gtk/index.md)
  1. [Livrer votre application](#livrer-votre-application)

## Importer

Pour importer les bibliothèques natives, exécutez toujours votre application avec `node --import node-gtk/register`.
Cela permet d'importer un espace de noms avec le schéma `gi:` :

```javascript
import Gtk from 'gi:Gtk-4.0'
import Adw from 'gi:Adw-1'
```

Pour voir les bibliothèques et versions installées, exécutez `node-gtk list`.

Voir [importing](./importing.md) pour les détails et la prise en charge CJS.

## Utiliser des bibliothèques

L'écosystème GTK utilise le système de types GObject, qui se reflète dans les classes, l'héritage,
les propriétés, les signaux, les énumérations/flags, etc.

**[Lisez le guide du système de types GObject](./gobject-introspection.md)** pour comprendre comment il
s'applique à JavaScript — lisez-le une fois et la documentation C/GI de GTK devient facile à suivre. Vous n'avez pas
besoin d'une compréhension complète pour commencer à construire, mais un aperçu rapide est préférable pour commencer à intégrer
ses concepts.

Une fois que vous avez un aperçu du système de types, vous pourrez utiliser la documentation de chaque bibliothèque.
Les plus utiles sont :
 - [Documentation GTK4](https://docs.gtk.org/gtk4/)
 - [Documentation Adwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/)
 
node-gtk publiera éventuellement sa propre documentation, mais en cas de
besoin, les exemples et la documentation de **GJS** et **PyGObject** se traduisent également bien.

## Widgets et style

Pour obtenir la liste des widgets disponibles, consultez [GTK Widgets](https://docs.gtk.org/gtk4/visual_index.html) et
[Adwaita widgets](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/widget-gallery.html).

Le CSS GTK et les classes sont utilisés pour le style. Il ne correspond pas complètement au CSS standard,
mais il s'en rapproche assez. `node-gtk` fournit un petit aide CSS pour le rechargement à chaud lors du développement,
voir [styles.md](./styles.md).

Lisez aussi les docs [Adwaita style-classes](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/style-classes.html)
et [CSS variables](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/css-variables.html).

## Outils de développement

Pour le débogage, vous pouvez démarrer Node avec `--inspect` ou `--inspect-brk` et utiliser les DevTools Chromium via `chrome://inspect`.

L'[GTK Inspector](https://developer.gnome.org/documentation/tools/inspector.html) est également disponible pour inspecter l'arbre des widgets et les styles.

![GTK Inspector](https://developer.gnome.org/documentation/_images/inspector-main-dark.png)

## TypeScript

Pour l'intégration **TypeScript**, vous devez générer les typages :

```sh
npx node-gtk generate-types Gtk-4.0 Pango-1.0 [etc]
```

Voir [typescript.md](./typescript.md)

Pour un guide pratique consacré à GTK4, Adwaita et Cairo avec TypeScript,
voir [typescript-gtk4-adwaita-cairo.md](./typescript-gtk4-adwaita-cairo.md).

La référence des widgets et des modèles de données est disponible dans
[typescript-gtk4-adwaita-cairo-widgets.md](./typescript-gtk4-adwaita-cairo-widgets.md).
Cette référence inclut également les contrôleurs d'événements, l'accessibilité,
les actions, le CSS GTK, Gdk, Graphene, Pango et les recettes Cairo avancées.

Le manuel [API et exemples TypeScript GTK4, Adwaita et Cairo](./typescript-gtk4-adwaita-cairo-api-examples.md)
regroupe les signatures usuelles, les exemples exécutables et les inventaires
API de GTK4, Adwaita et Cairo.

La documentation individuelle par classe est disponible dans
[typescript-widgets.md](./typescript-widgets.md).
Chaque fiche individuelle contient une capture illustrée avant sa description.

Pour un parcours progressif avec cinq projets complets et toute la référence,
consultez le livre [Développer des applications GNOME avec TypeScript](./livre-node-gtk/index.md).

## Livrer votre application

`node-gtk flatpak` package votre application sous forme de Flatpak — le format réellement installé par les utilisateurs
via GNOME Software, prêt pour Flathub. `node-gtk bundle` produit un
dossier portable autonome (et `.tar.gz`) qui s'exécute sans rien d'installé. Voir [bundling.md](./bundling.md).

## API bas niveau de node-gtk

Voir [api.md](./api.md) pour l'API bas niveau de `node-gtk`.