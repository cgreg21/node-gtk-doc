# Développer des applications GNOME avec TypeScript

## Le guide complet de node-gtk, GTK4, Libadwaita et Cairo

Ce livre accompagne le lecteur depuis la première fenêtre jusqu'à la livraison
d'une application de bureau complète. Il combine des explications progressives,
cinq projets pratiques et la documentation de référence existante de node-gtk.

Les exemples utilisent TypeScript, les modules ES et les conventions actuelles
de node-gtk :

```sh
node --import node-gtk/register dist/main.js
```

## Comment lire ce livre

Les chapitres 1 à 4 constituent le parcours conseillé. Les projets du chapitre 5
peuvent ensuite être réalisés indépendamment. Les annexes donnent accès à la
documentation détaillée, notamment aux fiches individuelles de chaque widget.

1. [Comprendre la pile GNOME](./01-comprendre-la-pile.md)
2. [Installer et préparer un projet TypeScript](./02-installation.md)
3. [Maîtriser GObject, les propriétés et les signaux](./03-gobject.md)
4. [Construire une interface maintenable](./04-architecture.md)
5. [Cinq projets complets](./05-projets.md)
6. [Distribuer et maintenir une application](./06-distribution.md)
7. [Référence complète et parcours thématiques](./07-reference.md)

## Projets du livre

| Projet | Notions principales |
|---|---|
| Bonjour GNOME | application, fenêtre, widgets, signaux |
| Liste de tâches | Libadwaita, actions, état, persistance |
| Tableau de bord Cairo | dessin, animation, redimensionnement |
| Visionneuse d'images | dialogue de fichiers, textures, erreurs |
| Catalogue filtrable | modèles, listes virtualisées, recherche |

## Versions et typages

GTK et Libadwaita évoluent indépendamment. Les signatures réellement disponibles
sont déterminées par les typelibs installés sur le système. Après chaque mise à
jour des bibliothèques, régénérez les types :

```sh
npx node-gtk generate-types \
  Gtk-4.0 Adw-1 Gio-2.0 GLib-2.0 Gdk-4.0 \
  Graphene-1.0 Pango-1.0 cairo-1.0
```

Le dossier `node_modules/.node-gtk-types` est la référence TypeScript de
l'environnement local.

