#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import JSZip from "jszip";
import { Marked, marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";

const rootDirectory = process.cwd();
const entryFile = resolve(rootDirectory, process.argv[2] ?? "livre-node-gtk/index.md");
const outputFile = resolve(
  rootDirectory,
  process.argv[3] ?? "livre-node-gtk-typescript.epub",
);

const mediaTypes = new Map([
  [".css", "text/css"],
  [".gif", "image/gif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".otf", "font/otf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);
const imageExtensions = new Map([
  ["image/gif", ".gif"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/svg+xml", ".svg"],
  ["image/webp", ".webp"],
]);

function toPosix(path) {
  return path.split(sep).join("/");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function splitTarget(href) {
  const match = href.match(/^([^?#]*)([?#].*)?$/);
  return { pathname: match?.[1] ?? href, suffix: match?.[2] ?? "" };
}

function isExternal(href) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href);
}

function isInsideRoot(path) {
  const localPath = relative(rootDirectory, path);
  return localPath !== ".." && !localPath.startsWith(`..${sep}`) && !isAbsolute(localPath);
}

async function existingFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function localTarget(sourceFile, href) {
  if (isExternal(href)) {
    return null;
  }

  const { pathname, suffix } = splitTarget(href);
  if (!pathname) {
    return null;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    decodedPath = pathname;
  }

  return {
    absolutePath: resolve(dirname(sourceFile), decodedPath),
    pathname,
    suffix,
  };
}

function inspectLinks(markdown) {
  const links = [];
  const tokens = marked.lexer(markdown);
  marked.walkTokens(tokens, (token) => {
    if ((token.type === "link" || token.type === "image") && token.href) {
      links.push({ href: token.href, type: token.type });
    }
  });
  return links;
}

async function collectPublication() {
  if (!isInsideRoot(entryFile)) {
    throw new Error("Le fichier d'entrée doit se trouver dans le dépôt.");
  }
  if (!(await existingFile(entryFile))) {
    throw new Error(`Fichier d'entrée introuvable : ${entryFile}`);
  }

  const documents = [];
  const assets = new Set();
  const remoteImages = new Set();
  const pending = [entryFile];
  const queued = new Set(pending);

  while (pending.length > 0) {
    const sourceFile = pending.shift();
    const markdown = await readFile(sourceFile, "utf8");
    const links = inspectLinks(markdown);
    documents.push({
      sourceFile,
      markdown,
    });

    for (const { href, type } of links) {
      if (type === "image" && /^https?:\/\//i.test(href)) {
        remoteImages.add(href);
        continue;
      }

      const target = localTarget(sourceFile, href);
      if (!target || !isInsideRoot(target.absolutePath)) {
        continue;
      }

      if (extname(target.absolutePath).toLowerCase() === ".md") {
        if (!queued.has(target.absolutePath) && (await existingFile(target.absolutePath))) {
          queued.add(target.absolutePath);
          pending.push(target.absolutePath);
        }
      } else if (await existingFile(target.absolutePath)) {
        assets.add(target.absolutePath);
      }
    }
  }

  return { documents, assets: [...assets], remoteImages: [...remoteImages] };
}

function publicationPath(sourceFile, extension = extname(sourceFile)) {
  const localPath = toPosix(relative(rootDirectory, sourceFile));
  return `OEBPS/${localPath.slice(0, -extname(localPath).length)}${extension}`;
}

function relativePublicationHref(sourceFile, targetFile, extension) {
  const from = publicationPath(sourceFile, ".xhtml");
  const to = publicationPath(targetFile, extension);
  const fromDirectory = from.slice(0, from.lastIndexOf("/") + 1);
  return toPosix(relative(fromDirectory, to));
}

function relativeArchiveHref(sourceFile, archivePath) {
  const from = publicationPath(sourceFile, ".xhtml");
  const fromDirectory = from.slice(0, from.lastIndexOf("/") + 1);
  return toPosix(relative(fromDirectory, archivePath));
}

function rewriteLinks(sourceFile, embeddedImages) {
  return (token) => {
    if ((token.type !== "link" && token.type !== "image") || !token.href) {
      return;
    }

    if (token.type === "image" && embeddedImages.has(token.href)) {
      token.href = relativeArchiveHref(sourceFile, embeddedImages.get(token.href).path);
      return;
    }

    const target = localTarget(sourceFile, token.href);
    if (!target || !isInsideRoot(target.absolutePath)) {
      return;
    }

    const extension =
      extname(target.absolutePath).toLowerCase() === ".md"
        ? ".xhtml"
        : extname(target.absolutePath);
    token.href =
      relativePublicationHref(sourceFile, target.absolutePath, extension) + target.suffix;
  };
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "node-gtk-doc EPUB generator" },
  });
  if (!response.ok) {
    throw new Error(`Téléchargement impossible (${response.status}) : ${url}`);
  }

  const mediaType = response.headers.get("content-type")?.split(";")[0].trim();
  const extension = imageExtensions.get(mediaType);
  if (!extension) {
    throw new Error(`Format d'image distant non pris en charge (${mediaType}) : ${url}`);
  }

  const name = createHash("sha256").update(url).digest("hex").slice(0, 20);
  return {
    content: Buffer.from(await response.arrayBuffer()),
    mediaType,
    path: `OEBPS/images/official/${name}${extension}`,
  };
}

async function downloadImages(urls) {
  const images = new Map();
  const concurrency = 8;

  for (let index = 0; index < urls.length; index += concurrency) {
    const batch = urls.slice(index, index + concurrency);
    const downloaded = await Promise.all(
      batch.map((url) => downloadImage(url)),
    );
    batch.forEach((url, batchIndex) => images.set(url, downloaded[batchIndex]));
  }

  return images;
}

function documentTitle(markdown, fallback) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1];
  return heading?.replace(/[*_`[\]]/g, "").trim() || fallback;
}

function xhtmlDocument({ title, body, stylesheet }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr" lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="${escapeXml(stylesheet)}"/>
</head>
<body>
${body}
</body>
</html>
`;
}

function makeNavigation(documents) {
  const items = documents
    .map(
      (document) =>
        `      <li><a href="${escapeXml(
          publicationPath(document.sourceFile, ".xhtml").slice("OEBPS/".length),
        )}">${escapeXml(document.title)}</a></li>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="fr" lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Table des matières</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table des matières</h1>
    <ol>
${items}
    </ol>
  </nav>
</body>
</html>
`;
}

function makePackage({
  documents,
  assets,
  embeddedImages,
  identifier,
  modified,
  title,
}) {
  const documentItems = documents
    .map(
      (document, index) =>
        `    <item id="doc-${index + 1}" href="${escapeXml(
          publicationPath(document.sourceFile, ".xhtml").slice("OEBPS/".length),
        )}" media-type="application/xhtml+xml"/>`,
    )
    .join("\n");
  const assetItems = assets
    .map(
      (asset, index) =>
        `    <item id="asset-${index + 1}" href="${escapeXml(
          publicationPath(asset).slice("OEBPS/".length),
        )}" media-type="${mediaTypes.get(extname(asset).toLowerCase())}"/>`,
    )
    .join("\n");
  const embeddedImageItems = [...embeddedImages.values()]
    .map(
      (image, index) =>
        `    <item id="official-image-${index + 1}" href="${escapeXml(
          image.path.slice("OEBPS/".length),
        )}" media-type="${image.mediaType}"/>`,
    )
    .join("\n");
  const spine = documents
    .map((_, index) => `    <itemref idref="doc-${index + 1}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="publication-id" xml:lang="fr">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="publication-id">${identifier}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>fr</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="style" href="style.css" media-type="text/css"/>
${documentItems}
${assetItems}
${embeddedImageItems}
  </manifest>
  <spine>
${spine}
  </spine>
</package>
`;
}

const stylesheet = `body {
  color: #202124;
  font-family: sans-serif;
  line-height: 1.55;
  margin: 5%;
}
h1, h2, h3, h4 { line-height: 1.2; }
h1 { break-before: page; }
a { color: #1c5d99; }
pre {
  background: #f3f4f6;
  border-radius: 0.25rem;
  overflow-wrap: break-word;
  padding: 0.8rem;
  white-space: pre-wrap;
}
code { font-family: monospace; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #aeb4ba; padding: 0.4rem; text-align: left; }
img { height: auto; max-width: 100%; }
blockquote { border-left: 0.25rem solid #aeb4ba; margin-left: 0; padding-left: 1rem; }
`;

async function generateEpub() {
  const publication = await collectPublication();
  const embeddedImages = await downloadImages(publication.remoteImages);
  const entryTitle = documentTitle(
    publication.documents[0].markdown,
    "Publication Markdown",
  );

  for (const document of publication.documents) {
    document.title = documentTitle(
      document.markdown,
      relative(rootDirectory, document.sourceFile),
    );
  }

  const hash = createHash("sha256");
  for (const document of publication.documents) {
    hash.update(toPosix(relative(rootDirectory, document.sourceFile)));
    hash.update(document.markdown);
  }
  const identifier = `urn:sha256:${hash.digest("hex")}`;
  const modified = new Date(
    Math.max(
      ...(await Promise.all(
        publication.documents.map(async ({ sourceFile }) => (await stat(sourceFile)).mtimeMs),
      )),
    ),
  )
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");

  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", {
    compression: "STORE",
    createFolders: false,
  });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`,
  );
  zip.file("OEBPS/style.css", stylesheet);
  zip.file("OEBPS/toc.xhtml", makeNavigation(publication.documents));

  for (const document of publication.documents) {
    const parser = new Marked(gfmHeadingId(), {
      gfm: true,
      walkTokens: rewriteLinks(document.sourceFile, embeddedImages),
    });
    const body = (await parser.parse(document.markdown))
      .replace(/<(br|hr|img|input)([^>]*?)(?<!\/)>/gi, "<$1$2/>");
    const stylesheetHref = relativePublicationHref(
      document.sourceFile,
      resolve(rootDirectory, "style.css"),
      ".css",
    );
    zip.file(
      publicationPath(document.sourceFile, ".xhtml"),
      xhtmlDocument({
        title: document.title,
        body,
        stylesheet: stylesheetHref,
      }),
    );
  }

  for (const asset of publication.assets) {
    const mediaType = mediaTypes.get(extname(asset).toLowerCase());
    if (!mediaType) {
      throw new Error(`Type de ressource non pris en charge : ${asset}`);
    }
    zip.file(publicationPath(asset), await readFile(asset));
  }
  for (const image of embeddedImages.values()) {
    zip.file(image.path, image.content);
  }

  zip.file(
    "OEBPS/content.opf",
    makePackage({
      ...publication,
      embeddedImages,
      identifier,
      modified,
      title: entryTitle,
    }),
  );

  await mkdir(dirname(outputFile), { recursive: true });
  const archive = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    platform: "UNIX",
  });
  await writeFile(outputFile, archive);

  console.log(
    `EPUB généré : ${relative(rootDirectory, outputFile)} (${publication.documents.length} documents, ${publication.assets.length + embeddedImages.size} ressources)`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateEpub().catch((error) => {
    console.error(`Erreur : ${error.message}`);
    process.exitCode = 1;
  });
}
