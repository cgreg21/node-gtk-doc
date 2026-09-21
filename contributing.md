
# Contribuer

### Générer compile_commands.json

Le fichier compile_commands_json est utilisé par les éditeurs et les serveurs de langage pour fournir l'autocomplétion.

```
npx node-pre-gyp configure --debug -- -f gyp.generator.compile_commands_json.py && mv Debug/compile_commands.json . && rm Debug Release 
```

### Scripts

Le dossier `scripts` contient :

 - `build.sh` : script de build (pour travis)
 - `install_node.sh` : installation de Node (pour travis)
 - `list-available-modules.js` : liste des modules disponibles depuis la ligne de commande (`node ./scripts/list-available-modules.js`)
 - `preinspect.js` : inspecte rapidement les métadonnées GIR (`node -r ./scripts/preinspect.js`)
 - `preload.js` : teste rapidement Gtk/Gdk (`node -r ./scripts/preload.js`)

## Mainteneurs

Cette section est destinée aux mainteneurs.

### Régénérer compile_commands.json

Source : https://github.com/nodejs/node-gyp/issues/1526#issuecomment-610670026

```
npx node-pre-gyp configure --release -- -f gyp.generator.compile_commands_json.py
mv Release/compile_commands.json .
```

## Checklist de publication

- Mettre à jour le changelog (et décider quelle composante de version sera incrémentée)
- Mettre à jour le readme si nécessaire
- `npm version [major/minor/patch]`
- `npm publish`
- `git commit --allow-empty -m '[publish binary]'`
- `git push --tags`
- Vérifier que le build `[publish binary]` réussit
- Vérifier que les binaires ont bien été envoyés dans le bucket S3
