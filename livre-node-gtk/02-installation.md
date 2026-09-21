# 2. Installer et préparer un projet TypeScript

## Prérequis

Installez Node.js, un compilateur C/C++, Python, `pkg-config`, GTK4,
GObject Introspection et, pour les projets GNOME, Libadwaita. Les paquets exacts
dépendent de la distribution. Vérifiez les espaces de noms visibles :

```sh
npx node-gtk list
```

## Structure recommandée

```text
mon-application/
├── src/
│   ├── main.ts
│   ├── application.ts
│   ├── actions.ts
│   └── ui/
│       └── main-window.ts
├── assets/
│   └── style.css
├── package.json
└── tsconfig.json
```

## package.json

```json
{
  "name": "mon-application-gtk",
  "private": true,
  "type": "module",
  "scripts": {
    "types": "node-gtk generate-types Gtk-4.0 Adw-1 Gio-2.0 GLib-2.0 Gdk-4.0 cairo-1.0",
    "build": "tsc",
    "start": "node --import node-gtk/register dist/main.js",
    "dev": "npm run build && npm run start"
  },
  "dependencies": {
    "node-gtk": "^4.1.1"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "typescript": "^5.9.0"
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts", "node_modules/.node-gtk-types/**/*.d.ts"]
}
```

## Première exécution

```sh
npm install
npm run types
npm run build
npm start
```

Le chargeur `node-gtk/register` est indispensable pour que Node reconnaisse le
schéma d'import `gi:`. Ne remplacez pas les imports par des chemins vers des
bibliothèques natives.

## Diagnostic rapide

| Symptôme | Vérification |
|---|---|
| `ERR_UNSUPPORTED_ESM_URL_SCHEME` | lancement sans `--import node-gtk/register` |
| espace de noms introuvable | typelib absent ou version incorrecte |
| propriété TypeScript inconnue | types non régénérés après une mise à jour |
| fenêtre sans contenu | enfant non affecté ou fenêtre non présentée |
| application figée | tâche synchrone longue dans le thread de l'interface |

Consultez aussi [la construction de node-gtk](../building.md) et
[le guide TypeScript](../typescript.md).

