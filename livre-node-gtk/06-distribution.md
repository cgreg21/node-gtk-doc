# 6. Distribuer et maintenir une application

## Construire

La compilation TypeScript doit être reproductible :

```sh
npm ci
npm run types
npm run build
```

N'embarquez pas les typelibs d'une version différente de celle utilisée pour
générer les types sans revalider l'application.

## Bundle portable

node-gtk peut produire un dossier autonome et une archive :

```sh
npx node-gtk bundle
```

Déclarez explicitement les ressources, bibliothèques et fichiers nécessaires.
Testez le bundle sur une machine qui ne contient pas votre environnement de
développement.

## Flatpak

Flatpak fournit un environnement GNOME cohérent et facilite la distribution :

```sh
npx node-gtk flatpak
```

Le manifeste doit déclarer les permissions minimales. Préférez les portails pour
les fichiers, notifications et interactions avec le système hôte.

## Journalisation

Journalisez les erreurs avec leur contexte, mais jamais les secrets ni le contenu
privé des documents. Une application distribuée doit expliquer à l'utilisateur
ce qu'il peut faire : réessayer, choisir un autre fichier ou consulter les logs.

## Mises à jour

Avant une montée de version :

1. relevez les versions GTK, Libadwaita et node-gtk ;
2. régénérez les déclarations TypeScript ;
3. compilez en mode strict ;
4. exécutez les tests métier ;
5. vérifiez manuellement les parcours visuels critiques ;
6. reconstruisez les formats de distribution.

## Documentation associée

- [Créer des bundles et Flatpaks](../bundling.md)
- [Construire node-gtk](../building.md)
- [Contribuer au projet](../contributing.md)
- [Migration N-API](../napi.md)

