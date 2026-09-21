# Compilation depuis les sources

Ce guide s'adresse aux **contributeurs** et à toute personne qui compile node-gtk depuis les sources.
La plupart des utilisateurs n'en ont pas besoin — `npm install node-gtk` fournit déjà des binaires précompilés (voir
[Installation](https://github.com/romgrk/node-gtk#installing)). Compilez depuis les sources pour modifier node-gtk,
ou pour cibler une plateforme ou une version de Node.js qui n'a pas de binaire préconstruit.

### Table des matières

- [Prérequis](#prérequis)
- [Compiler sur Ubuntu](#compiler-sur-ubuntu)
- [Compiler sur Fedora](#compiler-sur-fedora)
- [Compiler sur ArchLinux](#compiler-sur-archlinux)
- [Compiler sur macOS](#compiler-sur-macos)
- [Compiler sur Windows](#compiler-sur-windows)
- [Tester le projet](#tester-le-projet)
  - [Tests unitaires](#tests-unitaires)
  - [Démo navigateur](#démo-navigateur)

### Prérequis

- `git`
- `python3` (pour `node-gyp`)
- (selon votre système) un compilateur C (`gcc@8` ou plus récent, ou `clang`)

### Compiler sur Ubuntu

Installez les dépendances de base.

```sh
sudo apt-get install   build-essential git   gobject-introspection   libgirepository1.0-dev   libcairo2   libcairo2-dev
```

À ce stade, `npm install node-gtk` devrait déjà s'installer, fallback et compiler `node-gtk` sans problème.

### Compiler sur Fedora

Installez les dépendances de base :

```sh
sudo dnf install   @development-tools   nodejs   nodejs-devel   gobject-introspection   gobject-introspection-devel   gtk3   gtk3-devel   cairo   cairo-devel
```

Après installation des paquets, lancez `npm install node-gtk`.

### Compiler sur ArchLinux

Ce qui suit est le minimum nécessaire pour pouvoir compiler le projet.

```sh
pacman -S --needed   base-devel git   nodejs npm   gtk3 gobject-introspection   cairo
```

N'hésitez pas à installer tous les utilitaires `base-devel`.

Après cela, `npm install node-gtk` suffit.

### Compiler sur macOS

En supposant que vous avez [brew](http://brew.sh) installé, ce qui suit a été testé avec succès sur El Captain.

```sh
brew install git node gobject-introspection gtk+3 cairo
```

À ce stade, `npm install node-gtk` devrait déjà s'installer, fallback et compiler `node-gtk` sans problème.

### Compiler sur Windows

La dépendance obligatoire est l'environnement de compilation Visual C++ : Visual Studio Build Tools (avec la charge de travail "Visual C++ build tools") ou Visual Studio Community (avec la charge de travail "Desktop development with C++").

La manière la plus simple/testée pour compiler ce dépôt est dans un _shell MinGW_ fourni par l'[installeur MSYS2](https://msys2.github.io/).

Une fois VS et son compilateur C++ disponibles, et MSYS2 installé, lancez le shell MinGW.

```sh
# mettre à jour le système
# en cas d'erreur, attendez la fin de la mise à jour
# puis fermez et ouvrez à nouveau le shell MingW
pacman -Syyu --noconfirm

# installer git, gtk3 et les dépendances supplémentaires
pacman -S --needed --noconfirm git mingw-w64-$(uname -m)-{gtk3,gobject-introspection,pkg-config,cairo}

# où placer le clone du dépôt ?
# choisissez un dossier ou utilisez ~/oss (Open Source Software)
mkdir -p ~/oss/
cd ~/oss

# clonez node-gtk ici
git clone https://github.com/romgrk/node-gtk
cd node-gtk

# n'incluez pas /mingw64/include directement car il entre en conflit avec les en-têtes du SDK Windows. on copie les en-têtes nécessaires dans le dossier __extra__ :
./windows/mingw_include_extra.sh

# si MSYS2 n'est PAS installé dans C:/msys64, exécutez :
export MINGW_WINDOWS_PATH=$(./windows/mingw_windows_path.sh)

# node-gtk utilise pnpm pour le développement
npm install -g pnpm

# le premier lancement peut prendre du temps
GYP_MSVS_VERSION=2017 pnpm install
```

La variable `GYP_MSVS_VERSION` peut être 2017 ou une version supérieure.
Veuillez vérifier [quelle version utiliser](https://github.com/nodejs/node-gyp#installation)

La série d'articles ci-dessous vous aidera à démarrer :

1. [Node.js GTK Hello World on Windows](https://ten0s.github.io/blog/2022/07/22/nodejs-gtk-hello-world-on-windows)
2. [Find DLLs and Typelibs dependencies for Node.js GTK Application on Windows](https://ten0s.github.io/blog/2022/07/25/find-dlls-and-typelibs-dependencies-for-nodejs-gtk-application-on-windows)
3. [Package Node.js GTK Application on Windows](https://ten0s.github.io/blog/2022/07/27/package-nodejs-gtk-application-on-windows)

#### Problème possible sous le shell MinGW

Si vous lancez l'exécutable général sans connaître la bonne plateforme,
le chemin du binaire peut ne pas être disponible.

Dans ce cas, `python` n'est peut-être pas non plus disponible, et vous pouvez le vérifier avec la commande `which python`.

S'il n'est pas trouvé, vous devez exporteer le chemin du binaire lié à la plateforme :

```sh
# exemple pour la version 32 bits
export PATH="/mingw32/bin:$PATH"
pnpm run install
```

Cela devrait résoudre le problème. Vous pouvez aussi vérifier s'il existe un Python avec `pacman -Qs python`.

### Tester le projet

Si vous souhaitez vérifier que tout se compile et fonctionne correctement, après installation et compilation, vous pouvez lancer l'un des
exemples :

```sh
node --import node-gtk/register ./examples/hello-world.mjs
```

Si vous voyez une petite fenêtre affichant "hello", c'est bon : ça fonctionne !

Merci de noter que sur macOS la fenêtre ne s'ouvre pas automatiquement au-dessus des autres fenêtres.
Essayez <kbd>Cmd</kbd> + <kbd>Tab</kbd> si vous ne la voyez pas.

#### Tests unitaires

Lancez la suite de tests avec :

```sh
pnpm test
```

La suite inclut les tests `marshalling__*.js` et `regress__*.js` qui testent
les conversions de types de node-gtk (entrée/sortie/inout/retour pour chaque type GObject) contre les bibliothèques de test GObject-introspection — **GIMarshallingTests**, **Regress**
et **Utility**.

Ces bibliothèques sont fournies par `scripts/build-test-fixtures.js`, qui s'exécute automatiquement avant `pnpm test`. Pour garder l'API identique sur chaque machine, il
compile toujours à partir d'une seule révision figée du dépôt upstream
[`gobject-introspection-tests`](https://gitlab.gnome.org/GNOME/gobject-introspection-tests)
(téléchargé une fois et mis en cache), plutôt que de dépendre de la version fournie par la distribution. Il a besoin de `g-ir-scanner`/`g-ir-compiler`, d'un compilateur C,
des en-têtes de développement cairo, et de `curl`/`tar` ; si certains manquent, les tests de marshalling sont ignorés au lieu d'échouer. Les fixtures générées se trouvent dans `tests/gi-fixtures/`
(git-ignoré). Pour mettre à jour la révision upstream, modifiez `SOURCE_REF` dans le script.
Pour (re)compiler manuellement :

```sh
pnpm run build:test-fixtures                           # compile si absent
node scripts/build-test-fixtures.js --force --verbose  # force une reconstruction complète
```

#### Démo navigateur

Si vous souhaitez tester `./examples/browser.mjs`, vous aurez besoin de la bibliothèque [WebKit2 GTK+](http://webkitgtk.org/).

- sur **Ubuntu**, vous pouvez `apt-get install libwebkit2gtk-3.0` (`4.0` fonctionne aussi) puis l'essayer.
- sur **Fedora**, vous devez exécuter `sudo dnf install webkit2gtk3`
- sur **ArchLinux**, vous pouvez `pacman -S --needed webkitgtk` puis l'essayer.
- sur **macOS**, il n'existe pas de moyen de l'exécuter actuellement car `webkitgtk` a été supprimé de Homebrew

Une fois installée, vous pouvez la lancer sur `google.com` ou n'importe quelle autre page, et vous pouvez essayer le _thème sombre_ aussi :

```sh
# macOS doit avoir le thème Adwaita installé
# brew install adwaita-icon-theme

# Utilisation: node --import node-gtk/register ./examples/browser.mjs <url> [theme]
node --import node-gtk/register ./examples/browser.mjs  google.com  dark
```
