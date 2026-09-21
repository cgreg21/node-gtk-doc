# 4. Construire une interface maintenable

## Séparer les responsabilités

Une application durable distingue :

- **domaine** : données et règles sans dépendance GTK ;
- **services** : fichiers, réseau, préférences et persistance ;
- **présentation** : transformation de l'état en texte, couleurs et actions ;
- **interface** : fenêtres et widgets ;
- **application** : démarrage, actions globales et cycle de vie.

Cette séparation permet de tester l'essentiel avec Node.js sans ouvrir de fenêtre.

## Composition

Préférez de petites fonctions qui retournent un widget :

```ts
function createToolbar(onRefresh: () => void): Gtk.Widget {
  const button = new Gtk.Button({
    iconName: 'view-refresh-symbolic',
    tooltipText: 'Actualiser',
  })
  button.on('clicked', onRefresh)

  const bar = new Gtk.HeaderBar()
  bar.packEnd(button)
  return bar
}
```

Le callback rend la fonction indépendante du stockage et des appels réseau.

## État

Conservez une source de vérité. Après chaque modification :

1. validez l'entrée ;
2. modifiez l'état ;
3. persistez si nécessaire ;
4. mettez à jour uniquement les widgets concernés.

Pour une liste importante, modifiez le modèle plutôt que de reconstruire toute
la vue.

## CSS GTK

N'utilisez le CSS que pour l'apparence. La structure et les comportements restent
en TypeScript. Chargez un fournisseur de style au démarrage et appliquez des
classes sémantiques :

```css
.metric-value {
  font-size: 2rem;
  font-weight: bold;
}

.danger {
  color: @error_color;
}
```

Le guide [Styles GTK](../styles.md) détaille le chargement et le rechargement à
chaud.

## Accessibilité

Chaque contrôle doit avoir un libellé compréhensible, être accessible au clavier
et exposer un état. Utilisez les widgets standards avant de dessiner un contrôle
personnalisé. Testez les raccourcis, l'ordre de tabulation, les thèmes clair et
sombre et les grandes tailles de texte.

## Gestion d'erreurs

Une erreur attendue doit produire un message utile dans l'interface. Une erreur
inattendue doit également être journalisée avec son contexte. Libadwaita fournit
notamment les toasts et les dialogues d'alerte :

```ts
const toast = new Adw.Toast({
  title: 'Impossible d’enregistrer le document',
})
overlay.addToast(toast)
```

