# 1. Comprendre la pile GNOME

Une application node-gtk relie quatre couches :

1. **Node.js** exécute le code TypeScript compilé en JavaScript.
2. **node-gtk** traduit les appels JavaScript vers GObject Introspection.
3. **GTK4 et Libadwaita** fournissent les fenêtres, widgets, modèles et styles.
4. **Cairo, Gdk, Pango et Gio** couvrent le dessin, l'affichage, le texte, les
   actions, les fichiers et l'intégration au bureau.

## GTK4

GTK construit l'arbre visuel. Un widget possède généralement un parent, des
propriétés observables, des signaux et des classes CSS. GTK4 privilégie la
composition : une fenêtre contient un widget racine, lui-même composé de boîtes,
grilles, listes ou piles.

## Libadwaita

Libadwaita ajoute les composants et comportements recommandés pour GNOME :
fenêtres adaptatives, en-têtes, navigation, préférences, notifications et lignes
de réglages. Une application Libadwaita reste une application GTK ; les widgets
des deux bibliothèques se combinent.

## Cairo

Cairo est une API de dessin vectoriel immédiat. Dans un `Gtk.DrawingArea`, une
fonction de dessin reçoit un contexte Cairo et redessine la surface à la demande.
Cairo convient aux graphiques, cadrans, formes, exports PDF et SVG.

## GObject Introspection

Les bibliothèques GNOME publient des métadonnées décrivant classes, méthodes,
propriétés, signaux et types. node-gtk les charge à l'exécution. Cette mécanique
explique pourquoi :

- un espace de noms s'importe avec `gi:Nom-Version` ;
- les noms C en `snake_case` deviennent du `lowerCamelCase` ;
- les signaux conservent leur nom en `dash-case` ;
- les versions installées déterminent l'API disponible.

## Cycle de vie d'une application

Le point d'entrée crée une application, écoute `activate`, construit une fenêtre
puis appelle `run`. GTK gère ensuite la boucle d'événements :

```ts
import Gtk from 'gi:Gtk-4.0'

const app = new Gtk.Application({
  applicationId: 'com.example.Book',
})

app.on('activate', () => {
  const window = new Gtk.ApplicationWindow({
    application: app,
    title: 'node-gtk',
    defaultWidth: 720,
    defaultHeight: 480,
  })
  window.present()
})

app.run([])
```

Ne lancez pas de boucle bloquante dans un gestionnaire. Utilisez les API
asynchrones de Node.js ou de Gio, puis revenez mettre à jour l'interface.

## Ressources complémentaires

- [Importer les bibliothèques](../importing.md)
- [GObject Introspection](../gobject-introspection.md)
- [Fonctionnalités GIR](../gir-features.md)
- [API bas niveau](../api.md)

