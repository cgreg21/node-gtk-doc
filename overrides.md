# Remplacements

## Implémentation des remplacements

- [Fonctions qui créent GMainLoop](#fonctions-qui-créent-gmainloop)
- [Arguments de longueur](#arguments-de-longueur)
- [Valeurs de retour multiples](#valeurs-de-retour-multiples)
- [Résultat booléen](#résultat-booléen)

### Fonctions qui créent GMainLoop

Les fonctions qui créent un GMainLoop doivent être encapsulées comme dans l'extrait ci-dessous.
La fonction qui arrête la boucle créée doit être poussée dans `loopStack`.
En interne, NodeGTK utilise cette pile pour arrêter toutes les boucles actives en cas d'exception.

```javascript
const internal = require('../native.js')

const originalMain = Gtk.main
Gtk.main = function main() {
  const loopStack = internal.GetLoopStack()
  // Utiliser la même instance de `loopStack` pour empiler et dépiler
  loopStack.push(Gtk.mainQuit)
  originalMain()
  loopStack.pop()
}
```

### Arguments de longueur

Certaines fonctions ont des valeurs de retour qu'on peut ignorer, généralement parce qu'elles ne sont pas pertinentes dans un contexte JavaScript.
Un exemple de ce type est décrit [ici](https://gitlab.gnome.org/GNOME/gjs/issues/66)
Dans ces cas, il ne reste qu'une valeur de retour pertinente, qui doit devenir la valeur de retour JavaScript.

`g_key_file_load_from_data (GKeyFile *key_file, const gchar *data, gsize length, GError *error);`

```javascript
const loadFromData = GLib.KeyFile.loadFromData
GLib.KeyFile.loadFromData = function() {
  const [data, length] = loadFromData.apply(this, arguments)
  return data
}
```

### Valeurs de retour multiples

Méthodes qui renvoient plus d'une valeur de retour pertinente.
Dans ces cas, nous devons retourner un objet avec des propriétés portant les noms correspondants.

Exemple : `gtk_widget_get_request_size ( GtkWidget *widget, int *width, int *height );`

### Résultat booléen

Fonctions du type suivant :

```c
gboolean
g_file_get_contents (const gchar *filename,
                     gchar **contents,
                     gsize *length,
                     GError **error);
```

Elles renvoient un booléen pour permettre le style suivant en C :

```c
GError error;
if (!g_file_get_contents(..., &error)) {
  // Gérer l'erreur
}
```

Cela est sans objet en JS parce qu'une erreur serait levée et la valeur de retour booléenne est sans importance.
Dans ces cas, il faut simplement supprimer la valeur de retour booléenne et traiter le reste des arguments.
