# API

Voici la documentation de l'API de node-gtk elle-même. Pour la documentation des modules spécifiques (`Gtk`, `Gdk`, etc.), référez-vous à leur propre documentation. En général, https://developer.gnome.org/ est une bonne source, bien qu'il vous faudra chercher en `lower_snake_case` car il s'agit d'une API C.

### Exportations

- **[require(ns, [version])](#require)**
- **[prependSearchPath(path)](#prepend-search-path)**
- **[prependLibraryPath(path)](#prepend-library-path)**
- **[listAvailableModules()](#list-available-modules)**
- **[registerClass(klass)](#register-class-klass)**

Vous pouvez aussi importer un espace de noms directement via les modules ES avec le schéma `gi:` —
voir [require](#require).

Le package inclut aussi un petit utilitaire CSS pour le rechargement à chaud, importé depuis le sous-chemin `node-gtk/styles` — voir [styles.md](./styles.md).

<a id="require" />

#### require(ns, [version]) ⇒ `Object`

Charge un module. Charge automatiquement ses dépendances.

**Retourne** : `Object` - le module chargé

| Paramètre | Type     | Défaut | Description                               |
| --------- | -------- | ------ | ----------------------------------------- |
| ns        | `string` |        | espace de noms à charger                  |
| version   | `string` | `null` | version à charger (null pour la dernière) |

En ES modules, vous pouvez aussi importer un espace de noms directement avec le schéma `gi:`,
qui appelle `require` en interne. Installez les hooks avec
`node --import node-gtk/register app.mjs`, puis :

```javascript
import Gtk from 'gi:Gtk-4.0'      // la valeur exportée par défaut est l'objet espace de noms
import GLib from 'gi:GLib-2.0'    // `gi:Name-Version`, ou `gi:Name` pour la dernière version
const { Box, Label } = Gtk        // les membres sont lus depuis l'espace de noms
```

<a id="prepend-search-path" />

#### prependSearchPath(path)

Ajoute un chemin au début du chemin de recherche GObject-Introspection (pour les typelibs)

| Paramètre | Type     |
| --------- | -------- |
| path      | `string` |

<a id="prepend-library-path" />

#### prependLibraryPath(path)

Ajoute un chemin au début du chemin de bibliothèques GObject-Introspection (pour les bibliothèques partagées)

| Paramètre | Type     |
| --------- | -------- |
| path      | `string` |

<a id="list-available-modules" />

#### listAvailableModules()

Retourne la liste des modules disponibles

**Retourne** : `Promise<ModuleDescription[]>`

<a id="register-class-klass" />

#### registerClass(klass)

Enregistre une classe JavaScript (qui doit étendre un type GObject) en tant que nouveau GType, afin qu'elle
puisse être instanciée et utilisée comme un type natif.

**Cet appel est facultatif.** La première fois que vous faites `new MySubclass()`, node-gtk
registre la sous-classe à la demande (ainsi que les ancêtres encore non enregistrés),
ainsi la plupart du temps vous n'avez pas besoin d'appeler explicitement `registerClass`. Utilisez-le quand vous
avez besoin du GType *avant* de construire une instance — par exemple pour le lire avec
`getGType`, le référencer par nom dans un template GtkBuilder, ou l'utiliser comme type de propriété/enfant d'un autre type. Appeler `registerClass` sur une classe déjà enregistrée est un no-op.

Par défaut, le nom du GType est celui de la classe ; vous pouvez le remplacer avec un static
`GTypeName`. Pour remplacer une fonction virtuelle, définissez une méthode nommée `virtual_` +
le nom camelCase de la vfunc (par ex. `virtual_sizeAllocate` remplace `size_allocate`) ;
les méthodes simples ne sont jamais traitées comme des remplacements. Faites suivre avec
`super.virtual_<name>()`. Voir le guide [Héritage](./gobject-introspection.md#héritage) pour
plus de détails.

| Paramètre | Type    | Description                                                         |
| --------- | ------- | ------------------------------------------------------------------- |
| klass     | `Class` | la classe à enregistrer (doit étendre un type GObject)              |

Retourne `klass`, pour qu'il puisse être affecté ou utilisé comme décorateur.
