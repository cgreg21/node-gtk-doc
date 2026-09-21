#!/usr/bin/env node

import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

const widgetsDirectory = resolve("typescript-widgets");
const imagesDirectory = resolve(widgetsDirectory, "images", "official");
const officialHosts = new Set([
  "docs.gtk.org",
  "gnome.pages.gitlab.gnome.org",
]);
const supportedTypes = new Map([
  ["image/gif", ".gif"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/svg+xml", ".svg"],
  ["image/webp", ".webp"],
]);
const sourceNames = new Map([
  ["adw-aboutdialog", "about-dialog"],
  ["adw-actionrow", "action-row"],
  ["adw-applicationwindow", "window"],
  ["adw-clamp", "clamp-wide"],
  ["adw-comborow", "combo-row"],
  ["adw-entryrow", "entry-row"],
  ["adw-expanderrow", "expander-row"],
  ["adw-flap", "flap-wide"],
  ["adw-headerbar", "header-bar"],
  ["adw-leaflet", "leaflet-wide"],
  ["adw-navigationsplitview", "navigation-split-view"],
  ["adw-navigationview", "navigation-view"],
  ["adw-passwordentryrow", "password-entry-row"],
  ["adw-preferencesgroup", "preferences-group"],
  ["adw-preferencespage", "preferences-page"],
  ["adw-spinrow", "spin-row"],
  ["adw-splitbutton", "split-button"],
  ["adw-statuspage", "status-page"],
  ["adw-switchrow", "switch-row"],
  ["adw-toast", "toast-overlay"],
  ["adw-toastoverlay", "toast-overlay"],
  ["adw-toolbarview", "toolbar-view"],
  ["adw-viewswitcher", "view-switcher"],
  ["adw-viewswitcherbar", "view-switcher-bar"],
  ["gtk-alertdialog", "messagedialog"],
  ["gtk-checkbutton", "check-button"],
  ["gtk-dropdown", "drop-down"],
  ["gtk-filedialog", "filechooser"],
  ["gtk-linkbutton", "link-button"],
  ["gtk-listbox", "list-box"],
  ["gtk-menubutton", "menu-button"],
  ["gtk-paned", "panes"],
  ["gtk-passwordentry", "password-entry"],
  ["gtk-scale", "scales"],
  ["gtk-searchentry", "search-entry"],
  ["gtk-stacksidebar", "sidebar"],
  ["gtk-textview", "multiline-text"],
  ["gtk-togglebutton", "toggle-button"],
]);

function officialUrl(markdownFile) {
  const stem = basename(markdownFile, ".md");
  const sourceName =
    sourceNames.get(stem) ??
    stem.replace(/^adw-/, "").replace(/^gtk-/, "");
  const baseUrl = stem.startsWith("adw-")
    ? "https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest"
    : "https://docs.gtk.org/gtk4";
  return `${baseUrl}/${sourceName}.png`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function ensureLocalIllustration(markdown) {
  const match = markdown.match(
    /^!\[Capture d’écran de ([^\]]+)\]\(\.\/screenshots\/([^)]+\.svg)\)$/m,
  );
  if (!match) {
    return false;
  }

  const screenshotsDirectory = resolve(widgetsDirectory, "screenshots");
  const imagePath = resolve(screenshotsDirectory, match[2]);
  try {
    await access(imagePath);
    return false;
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const title = escapeXml(match[1]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#f6f5f4"/>
  <rect x="28" y="28" width="904" height="484" rx="18" fill="#ffffff" stroke="#c0bfbc" stroke-width="3"/>
  <rect x="28" y="28" width="904" height="72" rx="18" fill="#deddda"/>
  <circle cx="66" cy="64" r="9" fill="#e01b24"/>
  <circle cx="94" cy="64" r="9" fill="#f5c211"/>
  <circle cx="122" cy="64" r="9" fill="#33d17a"/>
  <text x="480" y="67" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#241f31">${title}</text>
  <rect x="112" y="164" width="736" height="250" rx="14" fill="#f2f1f0" stroke="#9a9996" stroke-width="2"/>
  <text x="480" y="270" text-anchor="middle" font-family="sans-serif" font-size="42" font-weight="bold" fill="#241f31">${title}</text>
  <text x="480" y="318" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#5e5c64">Schéma GTK4 / Adwaita / Cairo</text>
  <text x="480" y="370" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#77767b">Aucune capture officielle disponible</text>
</svg>
`;
  await mkdir(screenshotsDirectory, { recursive: true });
  await writeFile(imagePath, svg, "utf8");
  return true;
}

function imageName(markdownFile, url, contentType) {
  const sourceExtension = extname(new URL(url).pathname).toLowerCase();
  const extension = sourceExtension || supportedTypes.get(contentType);
  if (!extension) {
    throw new Error(`Extension d'image inconnue : ${url}`);
  }
  return `${basename(markdownFile, ".md")}${extension}`;
}

async function downloadImage(url) {
  const parsedUrl = new URL(url);
  if (!officialHosts.has(parsedUrl.hostname)) {
    throw new Error(`Hôte d'image non autorisé : ${parsedUrl.hostname}`);
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "node-gtk-doc image downloader" },
  });
  if (!response.ok) {
    throw new Error(`Téléchargement impossible (${response.status}) : ${url}`);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0].trim();
  if (!supportedTypes.has(contentType)) {
    throw new Error(`Format non pris en charge (${contentType}) : ${url}`);
  }

  return {
    content: Buffer.from(await response.arrayBuffer()),
    contentType,
  };
}

async function synchronizeImages() {
  const markdownFiles = (await readdir(widgetsDirectory))
    .filter((file) => file.endsWith(".md"))
    .sort();
  const remoteImagePattern = /^(!\[[^\]]*\]\()https:\/\/([^)]+)(\))$/m;
  const localImagePattern =
    /^!\[[^\]]*\]\(\.\/images\/official\/[^)]+\)$/m;
  const candidates = [];
  let illustrationsCreated = 0;

  for (const markdownFile of markdownFiles) {
    const path = resolve(widgetsDirectory, markdownFile);
    const markdown = await readFile(path, "utf8");
    if (await ensureLocalIllustration(markdown)) {
      illustrationsCreated += 1;
    }
    const match = markdown.match(remoteImagePattern);
    if (match) {
      candidates.push({ markdown, markdownFile, path, url: `https://${match[2]}` });
    } else if (localImagePattern.test(markdown)) {
      candidates.push({
        markdown,
        markdownFile,
        path,
        url: officialUrl(markdownFile),
      });
    }
  }

  await mkdir(imagesDirectory, { recursive: true });
  const concurrency = 8;

  for (let index = 0; index < candidates.length; index += concurrency) {
    const batch = candidates.slice(index, index + concurrency);
    const images = await Promise.all(batch.map(({ url }) => downloadImage(url)));

    await Promise.all(
      batch.map(async (candidate, batchIndex) => {
        const image = images[batchIndex];
        const filename = imageName(
          candidate.markdownFile,
          candidate.url,
          image.contentType,
        );
        const localReference = `./images/official/${filename}`;
        const updatedMarkdown = candidate.markdown.replace(
          remoteImagePattern,
          `$1${localReference}$3`,
        );

        await writeFile(resolve(imagesDirectory, filename), image.content);
        await writeFile(candidate.path, updatedMarkdown, "utf8");
      }),
    );
  }

  console.log(
    `${candidates.length} images officielles copiées localement, ${illustrationsCreated} schémas locaux créés.`,
  );
}

synchronizeImages().catch((error) => {
  console.error(`Erreur : ${error.message}`);
  process.exitCode = 1;
});
