# Documentation française de node-gtk

Ce dépôt rassemble une documentation française consacrée à
[node-gtk](https://github.com/romgrk/node-gtk), GTK4, Libadwaita et Cairo avec
JavaScript et TypeScript. Il contient un parcours progressif, des références
techniques, des fiches illustrées par widget et une version EPUB consultable
hors ligne.

## Commencer la lecture

- [Documentation générale](./index.md)
- [Livre complet : développer des applications GNOME avec TypeScript](./livre-node-gtk/index.md)
- [Guide pratique TypeScript, GTK4, Libadwaita et Cairo](./typescript-gtk4-adwaita-cairo.md)
- [Référence des widgets et modèles](./typescript-gtk4-adwaita-cairo-widgets.md)
- [Manuel API et exemples](./typescript-gtk4-adwaita-cairo-api-examples.md)
- [Index des fiches individuelles](./typescript-widgets/index.md)

Le livre suit sept chapitres, de la découverte de la pile GNOME jusqu'à la
distribution d'une application. Il propose également cinq projets complets :
une première fenêtre, une liste de tâches, un tableau de bord Cairo, une
visionneuse d'images et un catalogue filtrable.

## Contenu du dépôt

| Chemin | Contenu |
|---|---|
| `livre-node-gtk/` | Livre progressif en sept chapitres |
| `typescript-widgets/` | Fiches individuelles GTK4, Libadwaita et Cairo |
| `typescript-widgets/images/official/` | Copies locales des captures officielles |
| `typescript-widgets/screenshots/` | Schémas des classes sans capture officielle |
| `scripts/generate-epub.mjs` | Générateur EPUB 3 |
| `scripts/download-widget-images.mjs` | Synchronisation des images de widgets |
| `scripts/check-markdown-links.mjs` | Contrôle des liens Markdown |
| `livre-node-gtk-typescript.epub` | Livre généré pour une lecture hors ligne |

## Prérequis

- Node.js 20 ou une version ultérieure ;
- npm ;
- une connexion réseau pour actualiser les images officielles et vérifier les
  liens externes.

Installez les dépendances :

```sh
npm install
```

## Générer l'EPUB

La commande suivante génère `livre-node-gtk-typescript.epub` à partir de
`livre-node-gtk/index.md` :

```sh
npm run epub
```

Une entrée et une sortie différentes peuvent être fournies après `--` :

```sh
npm run epub -- chemin/vers/index.md sortie.epub
```

Le générateur suit les liens vers les autres fichiers Markdown du dépôt,
convertit les pages en XHTML, réécrit les liens internes et embarque les images,
les feuilles de style et les autres ressources locales.

## Actualiser les images des widgets

Les fiches utilisent des copies locales des captures publiées par les
documentations officielles GTK4 et Libadwaita :

```sh
npm run images:widgets
```

Cette commande :

1. télécharge les captures depuis les domaines officiels ;
2. les enregistre dans `typescript-widgets/images/official/` ;
3. conserve des chemins relatifs dans les fichiers Markdown ;
4. crée les schémas locaux manquants pour les classes sans capture officielle.

Après une actualisation, régénérez l'EPUB avec `npm run epub`.

## Vérifier les liens

Pour contrôler les fichiers locaux, les ancres Markdown et les URL HTTP :

```sh
npm run links:check
```

Le contrôle parcourt tous les fichiers Markdown, à l'exception de `.git` et
`node_modules`. Il échoue si une cible locale, une ancre ou une URL externe est
inaccessible.

Le contrôle déterministe utilisé par l'intégration continue ignore le réseau :

```sh
npm run links:check:local
```

## Cycle de mise à jour recommandé

```sh
npm install
npm run images:widgets
npm run links:check
npm run epub
```

## Publication automatisée

Le workflow GitHub Actions
[`epub.yml`](./.github/workflows/epub.yml) vérifie les liens, génère l'EPUB et
le conserve comme artefact pendant 30 jours. Il s'exécute sur les pull requests,
les modifications de la documentation envoyées sur `main` ou `master`, et
manuellement depuis l'onglet **Actions**.

Un tag commençant par `v` déclenche également la création d'une GitHub Release
avec l'EPUB en pièce jointe :

```sh
git tag v1.0.0
git push origin v1.0.0
```

Si la release existe déjà, son fichier EPUB est remplacé afin que le workflow
puisse être relancé sans créer de doublon.

## Utilisation des exemples node-gtk

Les exemples TypeScript supposent que les bibliothèques natives et leurs
typelibs sont installés. Une application compilée se lance généralement ainsi :

```sh
node --import node-gtk/register dist/main.js
```

Les signatures disponibles dépendent des versions installées. Les déclarations
TypeScript peuvent être régénérées avec :

```sh
npx node-gtk generate-types \
  Gtk-4.0 Adw-1 Gio-2.0 GLib-2.0 Gdk-4.0 \
  Graphene-1.0 Pango-1.0 cairo-1.0
```

Les types produits dans `node_modules/.node-gtk-types` constituent la référence
de l'environnement local.

## Sources officielles

- [node-gtk](https://github.com/romgrk/node-gtk)
- [Documentation GTK4](https://docs.gtk.org/gtk4/)
- [Documentation Libadwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/)
- [Manuel Cairo](https://www.cairographics.org/manual/)
- [GObject Introspection](https://gi.readthedocs.io/)

Les captures officielles restent soumises aux licences de leurs projets
respectifs.
