# 5. Cinq projets complets

Chaque projet part de la configuration du chapitre 2. Placez le code dans
`src/main.ts`, générez les types, compilez puis exécutez l'application.

## Projet 1 — Bonjour GNOME

**Objectif :** comprendre l'application, la fenêtre, la composition et les
signaux.

```ts
import Adw from 'gi:Adw-1'
import Gtk from 'gi:Gtk-4.0'

const app = new Adw.Application({
  applicationId: 'com.example.HelloGnome',
})

app.on('activate', () => {
  const count = new Gtk.Label({ label: '0', cssClasses: ['title-1'] })
  const increment = new Gtk.Button({ label: 'Incrémenter' })
  const reset = new Gtk.Button({ label: 'Réinitialiser' })
  let value = 0

  const render = () => {
    count.label = String(value)
    reset.sensitive = value !== 0
  }

  increment.on('clicked', () => {
    value++
    render()
  })
  reset.on('clicked', () => {
    value = 0
    render()
  })

  const buttons = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 12,
    halign: Gtk.Align.CENTER,
  })
  buttons.append(increment)
  buttons.append(reset)

  const content = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 18,
    marginTop: 32,
    marginBottom: 32,
    marginStart: 32,
    marginEnd: 32,
  })
  content.append(new Gtk.Label({ label: 'Nombre de clics' }))
  content.append(count)
  content.append(buttons)

  const window = new Adw.ApplicationWindow({
    application: app,
    title: 'Bonjour GNOME',
    defaultWidth: 420,
    defaultHeight: 280,
    content,
  })
  render()
  window.present()
})

app.run([])
```

**Extensions :** ajoutez des raccourcis, un bouton de décrémentation et une
limite configurable.

## Projet 2 — Liste de tâches persistante

**Objectif :** séparer l'état, la persistance et l'interface.

```ts
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import Adw from 'gi:Adw-1'
import Gtk from 'gi:Gtk-4.0'

type Task = { id: string; title: string; done: boolean }
const dataFile = join(homedir(), '.node-gtk-tasks.json')

async function loadTasks(): Promise<Task[]> {
  try {
    const value: unknown = JSON.parse(await readFile(dataFile, 'utf8'))
    if (!Array.isArray(value)) throw new Error('Le fichier doit contenir un tableau')
    return value.filter((item): item is Task =>
      typeof item === 'object' && item !== null &&
      typeof (item as Task).id === 'string' &&
      typeof (item as Task).title === 'string' &&
      typeof (item as Task).done === 'boolean')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

const saveTasks = (tasks: Task[]) =>
  writeFile(dataFile, JSON.stringify(tasks, null, 2), 'utf8')

const app = new Adw.Application({ applicationId: 'com.example.Tasks' })

app.on('activate', async () => {
  const tasks = await loadTasks()
  const list = new Gtk.ListBox({ selectionMode: Gtk.SelectionMode.NONE })
  const entry = new Gtk.Entry({
    placeholderText: 'Nouvelle tâche',
    hexpand: true,
  })

  const render = () => {
    let child = list.firstChild
    while (child) {
      const next = child.nextSibling
      list.remove(child)
      child = next
    }

    for (const task of tasks) {
      const check = new Gtk.CheckButton({
        label: task.title,
        active: task.done,
        marginTop: 8,
        marginBottom: 8,
        marginStart: 12,
        marginEnd: 12,
      })
      check.on('toggled', async () => {
        task.done = check.active
        await saveTasks(tasks)
      })
      list.append(check)
    }
  }

  const addTask = async () => {
    const title = entry.text.trim()
    if (!title) return
    tasks.push({ id: crypto.randomUUID(), title, done: false })
    entry.text = ''
    await saveTasks(tasks)
    render()
  }

  entry.on('activate', addTask)
  const add = new Gtk.Button({ label: 'Ajouter', cssClasses: ['suggested-action'] })
  add.on('clicked', addTask)

  const composer = new Gtk.Box({ spacing: 8 })
  composer.append(entry)
  composer.append(add)

  const page = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12,
    marginTop: 18,
    marginBottom: 18,
    marginStart: 18,
    marginEnd: 18,
  })
  page.append(composer)
  page.append(new Gtk.ScrolledWindow({ child: list, vexpand: true }))

  const window = new Adw.ApplicationWindow({
    application: app,
    title: 'Mes tâches',
    defaultWidth: 520,
    defaultHeight: 640,
    content: page,
  })
  render()
  window.present()
})

app.run([])
```

**Extensions :** suppression, filtre des tâches terminées, validation par toast
et stockage dans le répertoire de données GLib.

## Projet 3 — Tableau de bord Cairo

**Objectif :** dessiner un composant redimensionnable et l'animer.

```ts
import Gtk from 'gi:Gtk-4.0'
import GLib from 'gi:GLib-2.0'
import cairo from 'gi:cairo-1.0'

const app = new Gtk.Application({ applicationId: 'com.example.Dashboard' })

app.on('activate', () => {
  const drawing = new Gtk.DrawingArea({
    contentWidth: 640,
    contentHeight: 360,
    hexpand: true,
    vexpand: true,
  })
  let phase = 0

  drawing.setDrawFunc((_area, cr: cairo.Context, width, height) => {
    cr.setSourceRGB(0.08, 0.1, 0.14)
    cr.paint()

    cr.setLineWidth(3)
    cr.setSourceRGB(0.35, 0.75, 1)
    cr.moveTo(0, height / 2)
    for (let x = 0; x <= width; x += 4) {
      const y = height / 2 + Math.sin(x / 45 + phase) * height * 0.28
      cr.lineTo(x, y)
    }
    cr.stroke()

    cr.setSourceRGB(1, 1, 1)
    cr.selectFontFace('Sans', cairo.FontSlant.NORMAL, cairo.FontWeight.BOLD)
    cr.setFontSize(24)
    cr.moveTo(24, 38)
    cr.showText('Signal en temps réel')
  })

  const timer = GLib.timeoutAdd(GLib.PRIORITY_DEFAULT, 33, () => {
    phase += 0.08
    drawing.queueDraw()
    return GLib.SOURCE_CONTINUE
  })

  const window = new Gtk.ApplicationWindow({
    application: app,
    title: 'Tableau de bord',
    defaultWidth: 760,
    defaultHeight: 440,
    child: drawing,
  })
  window.on('close-request', () => {
    GLib.sourceRemove(timer)
    return false
  })
  window.present()
})

app.run([])
```

**Extensions :** grille, légende, plusieurs séries, export SVG/PDF et données
reçues depuis un flux réseau.

## Projet 4 — Visionneuse d'images

**Objectif :** utiliser un dialogue asynchrone, `Gio.File` et `Gtk.Picture`.

```ts
import Adw from 'gi:Adw-1'
import Gio from 'gi:Gio-2.0'
import Gtk from 'gi:Gtk-4.0'

const app = new Adw.Application({ applicationId: 'com.example.ImageViewer' })

app.on('activate', () => {
  const picture = new Gtk.Picture({
    canShrink: true,
    contentFit: Gtk.ContentFit.CONTAIN,
    hexpand: true,
    vexpand: true,
  })
  const overlay = new Adw.ToastOverlay({ child: picture })
  const open = new Gtk.Button({ iconName: 'document-open-symbolic' })
  const header = new Adw.HeaderBar()
  header.packStart(open)

  const toolbar = new Adw.ToolbarView({ content: overlay })
  toolbar.addTopBar(header)

  const window = new Adw.ApplicationWindow({
    application: app,
    title: 'Visionneuse',
    defaultWidth: 900,
    defaultHeight: 640,
    content: toolbar,
  })

  open.on('clicked', () => {
    const dialog = new Gtk.FileDialog({ title: 'Choisir une image' })
    dialog.open(window, null, (_source, result) => {
      try {
        const file: Gio.File = dialog.openFinish(result)
        picture.file = file
        window.title = file.basename ?? 'Visionneuse'
      } catch (error) {
        overlay.addToast(new Adw.Toast({
          title: error instanceof Error ? error.message : 'Ouverture impossible',
        }))
      }
    })
  })

  window.present()
})

app.run([])
```

**Extensions :** glisser-déposer, zoom, historique, rotation et métadonnées.

## Projet 5 — Catalogue filtrable

**Objectif :** construire une recherche réactive. Pour un petit catalogue,
`Gtk.ListBox` reste lisible ; remplacez-le par `Gtk.ListView` lorsque le volume
justifie la virtualisation.

```ts
import Adw from 'gi:Adw-1'
import Gtk from 'gi:Gtk-4.0'

type Item = { name: string; category: string; description: string }
const items: Item[] = [
  { name: 'Bouton', category: 'Contrôle', description: 'Déclenche une action.' },
  { name: 'Liste', category: 'Données', description: 'Affiche des éléments.' },
  { name: 'Cairo', category: 'Dessin', description: 'Produit des graphismes.' },
]

const app = new Adw.Application({ applicationId: 'com.example.Catalog' })

app.on('activate', () => {
  const search = new Gtk.SearchEntry({ placeholderText: 'Rechercher' })
  const list = new Gtk.ListBox({ selectionMode: Gtk.SelectionMode.NONE })

  const render = () => {
    let child = list.firstChild
    while (child) {
      const next = child.nextSibling
      list.remove(child)
      child = next
    }

    const query = search.text.trim().toLocaleLowerCase('fr')
    const visible = items.filter((item) =>
      `${item.name} ${item.category} ${item.description}`
        .toLocaleLowerCase('fr')
        .includes(query))

    for (const item of visible) {
      list.append(new Adw.ActionRow({
        title: item.name,
        subtitle: `${item.category} — ${item.description}`,
      }))
    }
  }

  search.on('search-changed', render)
  const content = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12,
    marginTop: 18,
    marginBottom: 18,
    marginStart: 18,
    marginEnd: 18,
  })
  content.append(search)
  content.append(new Gtk.ScrolledWindow({ child: list, vexpand: true }))

  const window = new Adw.ApplicationWindow({
    application: app,
    title: 'Catalogue',
    defaultWidth: 680,
    defaultHeight: 560,
    content,
  })
  render()
  window.present()
})

app.run([])
```

**Extensions :** chargement JSON, catégories, tri, vue détaillée et modèle
virtualisé.

## Revue avant livraison

Pour chacun des projets, vérifiez :

- le lancement depuis un terminal propre ;
- le clavier, les thèmes et le redimensionnement ;
- les erreurs de fichiers et les données invalides ;
- l'absence de tâche synchrone longue ;
- la régénération des types sur la plateforme cible.

