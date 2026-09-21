## Fonctionnalités prises en charge

Il reste des fonctionnalités moins utilisées qui ne sont pas prises en charge, mais tout ce dont vous avez besoin pour commencer à créer
une application Gtk fonctionnelle est supporté.

- [x] types de données primitives (int, char, …)
- [x] types de données complexes (tableaux, GArray, GList, GHashTable, …)
- [x] GObjects
- [x] Interfaces : méthodes sur les GObjects
- [ ] Interfaces : conversion de struct C brute vers JS
- [x] Signaux (`.connect('signal', cb)` ou `.on('signal', cb)`)
- [x] Boxed (struct et union) (opaque, avec `new`)
- [x] Boxed (struct et union) (opaque, sans `new`)
- [x] Boxed (struct et union) (allocation avec taille)
- [x] Gestion des erreurs
- [x] Arguments de callback
- [x] Appel de fonction : arguments IN, OUT & INOUT
- [x] Propriétés (sur GObjects)
- [x] Champs (sur Boxeds)
- [x] Boucle d'événements (principale)
- [ ] Boucles d'événements supplémentaires (par ex. `g_timeout_add_seconds`)
- [ ] GParamSpec
- [x] Héritage JavaScript de classes C
- [x] Gestion de la mémoire
