# Bundling — livrez votre application aux utilisateurs

Deux commandes couvrent la distribution, pour deux publics différents :

- **[`node-gtk flatpak`](#flatpak)** — la manière dont **les vrais utilisateurs installent les applications** :
  un Flatpak, installable en un clic via GNOME Software, distributable sur
  Flathub (mises à jour, sandboxing, runtime GTK partagé). Commencez ici pour une distribution bureautique.
- **[`node-gtk bundle`](#bundles-portables)** — un **dossier portable autonome**
  (plus `.tar.gz`) : votre code, un runtime Node, le module compilé, et l'intégralité du runtime GTK. S'exécute sur des machines sans rien d'installé ; adapté aux artefacts GitHub, kiosques, flottes, et liens "essayez mon application".

Les deux lisent la même configuration `"bundle"` dans votre `package.json`.

> **Support des plateformes : Linux aujourd'hui.** macOS et Windows sont prévus ; le travail spécifique à la plateforme est isolé derrière une interface unique
> (`tools/bundle/platform-*.js`), et la logique de fermeture DLL Windows est déjà validée par le prebuilt npm autonome (`scripts/windows-bundle-runtime.sh`).

# Bundles portables

## Utilisation

```sh
cd my-app
npx node-gtk bundle            # → dist/MyApp-linux-x64/
npx node-gtk bundle --archive  # → dist/MyApp-linux-x64.tar.gz aussi
```

Prérequis au moment du bundle : l'application est installée (`node_modules` présent,
quel que soit le gestionnaire de paquets — les layouts pnpm symlinks sont gérés), node-gtk a un addon compilé pour le Node exécuté, et la pile GTK cible est installée. **Le Node qui exécute le bundler est le Node qui est embarqué.**

Les utilisateurs lancent le lanceur — aucune installation nécessaire :

```sh
tar xzf MyApp-linux-x64.tar.gz
./MyApp-linux-x64/MyApp
```

## Structure de sortie

```
MyApp-linux-x64/
├── MyApp           lanceur (sh) — configure l'environnement runtime, exécute le Node embarqué
├── bundle.json     manifeste : nom, id, versions, chemin du lanceur
├── runtime/        ← identique pour toutes les apps partageant la même version node-gtk/GTK/Node
│   ├── node        binaire Node (copie allégée du Node de bundling)
│   ├── lib/        fermeture des bibliothèques partagées + girepository-1.0/ typelibs
│   │   └── gdk-pixbuf-2.0/…/loaders + loaders.cache.in relocalisable
│   └── share/      schémas GSettings compilés, thèmes Adwaita/hicolor
└── app/            ← le vôtre : fichiers depuis `include` + node_modules en production
```

La séparation `runtime/` vs `app/` est intentionnelle : `runtime/` contient du contenu identique pour chaque application construite avec les mêmes versions node-gtk/GTK/Node, de sorte qu'un install partagé de runtime futur (ou des stores de contenu adressé comme Flatpak) puisse le dédupliquer sans changement d'architecture. `app/` est généralement de quelques MB.

Le lanceur définit `LD_LIBRARY_PATH`, `GI_TYPELIB_PATH` et `XDG_DATA_DIRS` pour préférer `runtime/`, génère un cache de chargeurs gdk-pixbuf par installation (le format du cache a besoin de chemins absolus), `cd` dans `app/` et exécute `runtime/node` sur votre entrée.

## Configuration

Tout vit sous la clé `"bundle"` de votre `package.json` ; chaque champ est optionnel :

```jsonc
{
  "main": "src/main.js",
  "bundle": {
    "name": "MyApp",                 // nom du lanceur/fichier ; défaut : PascalCase du nom du paquet
    "id": "com.example.MyApp",       // identifiant reverse-DNS (dossiers de cache) ; défaut dérivé
    "entry": "src/main.js",          // défaut : "main"
    "gtk": 4,                        // n'empaqueter que cette version majeure GTK (défaut : tout installé)
    "include": ["src/**", "assets/**"],  // fichiers de l'app ; défaut : "**/*" excluant
                                     // node_modules/.git/dist/out/build
    "nodeArgs": ["--max-old-space-size=512"], // flags Node supplémentaires, si besoin
    "register": true,                // défaut : les lanceurs passent --import node-gtk/register
                                     // afin que les imports `gi:` fonctionnent ; mettre false pour désactiver
    "libraries": ["libgstreamer-1.0.so.0"],  // graines supplémentaires de fermeture (GStreamer, libsoup, …)
    "omitPackages": ["some-dev-helper"],     // paquets npm à laisser de côté
    "icons": false,                  // sauter les thèmes Adwaita/hicolor (défaut : true)
    "node": "vendor/node",           // embarquer ce binaire Node à la place (même ABI !)
    "out": "release"                 // défaut : dist/<name>-<platform>-<arch>
  }
}
```

Les flags CLI `--out`, `--name`, `--entry`, `--archive` remplacent la config.

### Ce qui est embarqué, ce qui reste sur l'hôte

La fermeture de bibliothèques partagées est parcourue avec `ldd`, amorcée depuis l'addon, les bibliothèques de namespaces GI (GTK, Adwaita, Pango, GdkPixbuf, … — voir `tools/bundle/seeds.js` ; celles qui manquent sont ignorées, `libraries` ajoute plus) et les chargeurs gdk-pixbuf. Les bibliothèques liées à l'hôte sont **exclues**, suivant la [liste d'exclusion de la communauté AppImage](https://github.com/AppImageCommunity/pkg2appimage/blob/master/excludelist) : glibc, le stack GPU/OpenGL, les bibliothèques client X11/Wayland, et le stack de polices (fontconfig/freetype/harfbuzz), que chaque bureau fournit.

Paquets Node : la fermeture des dépendances de production de votre application, liens symboliques résolus. node-gtk lui-même est réduit à `package.json` + `lib/` avec seulement l'addon compilé pour l'ABI cible ; ses dépendances de build (node-pre-gyp, node-gyp, nan) ne sont jamais embarquées.

### Baseline de compatibilité

Un bundle s'exécute sur les distributions dont la **glibc est au moins aussi récente** que celle de la machine de build (contrainte classique de Linux portable — les bibliothèques exclues sont résolues contre l'hôte). Construisez sur la distribution la plus ancienne que vous voulez supporter ; un runner GitHub Actions `ubuntu-latest` est une ligne de base raisonnable.
`bundle.node` existe pour pouvoir embarquer un Node compilé contre une glibc plus ancienne que celle de votre machine.

### Prévisions de taille

GTK4 + Adwaita + typelibs + icônes ≈ 135 MB, Node ≈ 110 MB, ~100 MB en `.tar.gz` — de type Electron. `"gtk": 4` évite aussi d'embarquer GTK3 sur une machine qui en a les deux ; `"icons": false` économise ~15 MB si vous comptez sur les thèmes de l'hôte.

## Vérifier un bundle

La CI exécute `scripts/bundle-smoke-test.js` (bundle une application minimale, exécute son lanceur, vérifie que l'application s'est exécutée sous le Node embarqué). Pour vérifier d'où les bibliothèques se résolvent sur votre machine :

```sh
LD_DEBUG=libs ./dist/MyApp-linux-x64/MyApp 2>&1 | grep 'trying file.*libgtk'
```

# Flatpak

```sh
cd my-app
npx node-gtk flatpak             # générer + construire + MyApp.flatpak
npx node-gtk flatpak --install   # …et l'installer (utilisateur), puis :
flatpak run com.example.MyApp
```

Le fichier de sortie `dist/flatpak/MyApp.flatpak` est **un seul fichier que les utilisateurs double-cliquent pour installer** via GNOME Software sur n'importe quelle distribution — le fichier intègre la référence du dépôt Flathub, donc le runtime GNOME est récupéré automatiquement. Pour une vraie distribution, [soumettez le manifeste généré à Flathub](#livrer-sur-flathub).

Prérequis : `flatpak` plus un builder (`flatpak install flathub org.flatpak.Builder`, ou le paquet `flatpak-builder` de votre distribution). La première build télécharge le GNOME SDK (~1 Go, mis en cache). `--no-build` génère tout sans construire.

## Comment ça marche

Contrairement à `node-gtk bundle`, **rien de GTK n'est embarqué** : l'application s'exécute sur `org.gnome.Platform`, partagé par toutes les apps Flatpak et mis à jour indépendamment. Ce qu'il y a dans `/app` est seulement votre code, Node (depuis l'extension SDK `org.freedesktop.Sdk.Extension.node<N>`) et l'addon node-gtk.

`flatpak-builder` construit hors ligne, ce qui est normalement pénible pour les apps Node (générateurs de lockfile / sources). Nous contournons cela : la même étape d'arbre app `node-gtk bundle` utilise pour préparer les fichiers + `node_modules` de production (pnpm-safe, liens symboliques résolus) comme source `dir` simple. La seule chose compilée dans le sandbox est l'addon node-gtk, contre le GTK du runtime, en utilisant les en-têtes Node de l'extension SDK (`--nodedir`) — toujours sans réseau.

## Configuration Flatpak

La clé partagée `"bundle"`, plus une sous-clé `"flatpak"` :

```jsonc
"bundle": {
  "name": "MyApp",
  "id": "io.github.you.myapp",     // DOIT être votre application-id de Gtk.Application ;
                                   // Flathub exige io.github.*/io.gitlab.*
                                   // pour les ids basés sur le code hosting
  "summary": "Does the thing",     // commentaire .desktop + résumé AppStream
  "license": "MIT",                // SPDX, par défaut la licence de package.json
  "categories": ["GTK", "Utility"],
  "flatpak": {
    "runtimeVersion": "50",        // version de org.gnome.Platform — épingler celle
                                   // que vous avez testée
    "node": 26,                    // majeur de l'extension SDK (20/22/24/26)
    "finishArgs": [                // permissions du sandbox au-delà des options GUI par défaut
      "--share=network",
      "--filesystem=home"
    ],
    "lintExceptions": {            // erreurs lint que votre app prend en charge ; chacune doit être demandée (avec cette justification)
                                   // dans la PR de soumission Flathub
      "finish-args-host-filesystem-access": "MyApp is a file manager; …"
    }
  }
}
```

Flags : `--install` (installer au niveau utilisateur), `--run` (installer + lancer), `--no-build`
(générer uniquement), `--release` / `--release-url` (sources de soumission Flathub,
ci-dessous), `--lint` (lancer `flatpak-builder-lint` sur le manifeste + metainfo — à faire avant de soumettre n'importe où).

Les valeurs par défaut n'autorisent que l'accès GUI (`wayland`, `fallback-x11`, `ipc`, `dri`) —
le réseau et le système de fichiers sont volontairement opt-in ; demandez le minimum, Flathub le valide.

## Fichiers d'intégration bureau

Livrez vos propres fichiers aux emplacements conventionnels et ils seront utilisés tels quels ;
ce qui manque reçoit un stub minimal généré :

- `data/<id>.desktop` — copié avec seulement `Exec=` réécrit en commande du sandbox, pour qu'un seul fichier serve host installs et flatpak. Gardez `Icon=<id>` : flatpak n'exporte que les icônes nommées comme l'id de l'application.
- `data/<id>.metainfo.xml` — copié tel quel. Le stub généré passe la validation, mais la revue Flathub veut une vraie description, des captures d'écran et des notes de version seulement vous pouvez écrire — commencez à partir du stub dans `dist/flatpak/`.
- `data/icons/hicolor/<size>/apps/<id>.(svg|png)` — tout l'arbre du thème est embarqué (variantes dimensionnées, vectorielles et symboliques). Alternative mono-fichier : `"bundle": { "icon": "assets/icon.svg" }`.

Remplacez la découverte avec `"bundle": { "desktopFile": …, "metainfo": …,
"iconsDir": … }` si votre structure diffère.

Quatre points qui mordent :

- **L'id Flatpak doit correspondre à l'`applicationId` de votre `Gtk.Application`** —
  sinon GNOME Shell ne peut associer les fenêtres à l'application (icône générique, mauvais élément du dock).
- Le sandbox n'a pas de système de fichiers de l'hôte par défaut : les lectures `fs` hors du sandbox doivent avoir des permissions `--filesystem=`, ou mieux, les portails XDG.
- **Les URI GVfs (`trash:///`, `recent:///`, `mtp://`, `smb://`, …) échouent avec "Operation not supported" même sous `--filesystem=host`** : GIO y accède via les daemons gvfs de l'hôte, ce qui nécessite
  `"--talk-name=org.gtk.vfs.*"` + `"--filesystem=xdg-run/gvfsd"` dans
  `finishArgs`.
- **La surface API suit les bibliothèques du runtime, pas celles de votre machine de dev.** Un hôte rolling-release peut exposer des noms introspectés qu'un runtime GNOME légèrement plus ancien n'a pas (par ex. glib ≥2.88 introspecte
  `g_unix_signal_add_full` comme `GLibUnix.signalAdd` ; le runtime GNOME 49 de glib 2.86 l'appelle `signalAddFull`). Écrivez des lookups tolérants à la version
  (`GLibUnix.signalAdd ?? GLibUnix.signalAddFull`) et testez dans le sandbox — une REPL node contre le runtime est une commande :
  `flatpak run --command=/app/bin/node <your.app.Id>`.

## Livrer sur Flathub

Flathub construit sur sa propre infrastructure à partir de sources *récupérables* — l'arbre local mis en scène ne peut pas être soumis directement. `--release` produit exactement ce qu'une soumission nécessite :

```sh
npx node-gtk flatpak --release --lint
```

- `<Name>-<version>-flatpak-src.tar.gz` — les sources mises en scène (app + `node_modules` de production + fichiers bureau) sous forme d'un tarball unique
- `flathub/<id>.yml` — le manifeste référencant ce tarball par URL + sha256
  (URL dérivée de `package.json` `"repository"` :
  `https://github.com/<you>/<app>/releases/download/v<version>/<tarball>` ;
  remplacez via `--release-url`). Le dossier `flathub/` est exactement ce que contient la PR de soumission, et le manifeste est nommé `<id>.yml` parce que le linter l'exige.

Le flux :

1. Corrigez tout ce que `--lint` signale. Garde-fous classiques : l'id de l'application — Flathub rejette `com.github.*`; une application hébergée sur GitHub doit utiliser `io.github.<you>.<app>`
   (et `applicationId` doit correspondre) — et les permissions larges comme
   `--filesystem=host`, déclarées dans `"lintExceptions"` avec une justification et accordées application par application lors de la revue.
2. Créez la release GitHub `v<version>` et téléversez le tarball :
   `gh release create v<version> dist/flatpak/<tarball>`.
3. Fork [flathub/flathub](https://github.com/flathub/flathub), branchez `new-pr` (pas master), ajoutez le contenu de `dist/flatpak/flathub/`, et ouvrez une PR contre `new-pr`. Demandez les `lintExceptions` dans la description de la PR avec leurs justifications.

Après acceptation, les utilisateurs trouvent l'application dans GNOME Software et chaque mise à jour est livrée automatiquement — de nouvelles versions sont un changement de version + nouveau tarball +
modification du manifeste dans votre dépôt Flathub.

Une mise en garde si vous lancez le contrôle le plus profond localement
(`flatpak-builder-lint repo dist/flatpak/repo`) : il signale
`appstream-screenshots-not-mirrored-in-ostree` /
`appstream-external-screenshot-url`. Tout cela est attendu hors de l'infrastructure Flathub — leur pipeline reflète automatiquement les captures dans `dl.flathub.org/media`.

Alternative sans Flathub : hébergez votre propre dépôt flatpak (un dépôt ostree est simplement des fichiers statiques — GitHub Pages marche) et pointez les utilisateurs vers un `.flatpakref` ; vous gardez la livraison des mises à jour, sans la découvrabilité du store.

# Feuille de route

- **Windows** : même architecture `bundle` ; fermeture DLL via `ntldd` (déjà validée en CI pour le prebuilt npm), lanceur `.cmd`, archive `.zip`. Nécessite un environnement MSYS2 MINGW64 au moment du bundle.
- **macOS** : fermeture dylib via `otool -L` depuis Homebrew,
  relocation `install_name_tool` + re-signature ad hoc, sortie `.app`/`.dmg`, lanceur `DYLD_FALLBACK_LIBRARY_PATH`. La distribution exige aussi la signature + notarisation (compte développeur Apple).
- **AppImage** : enveloppe mono-fichier autour de l'arbre portable exact.
- **Runtime partagé** (bundles portables) : installer `runtime/` une fois par machine
  (`~/.local/share/node-gtk/runtime/<version>`), les applications le résolvent en priorité relative — la disposition le supporte déjà.
