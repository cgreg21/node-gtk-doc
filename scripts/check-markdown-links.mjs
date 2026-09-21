#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { marked } from "marked";
import { getHeadingList, gfmHeadingId } from "marked-gfm-heading-id";

const rootDirectory = process.cwd();
const localOnly = process.argv.includes("--local-only");
const ignoredDirectories = new Set([".git", "node_modules"]);
const externalUrls = new Map();
const failures = [];

marked.use(gfmHeadingId());

function displayPath(path) {
  return relative(rootDirectory, path).split(sep).join("/");
}

async function filesBelow(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesBelow(path)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path);
    }
  }
  return files;
}

async function exists(path) {
  try {
    return await stat(path);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function splitHref(href) {
  const hashIndex = href.indexOf("#");
  return hashIndex === -1
    ? { pathname: href, fragment: "" }
    : {
        pathname: href.slice(0, hashIndex),
        fragment: decode(href.slice(hashIndex + 1)),
      };
}

function collectLinks(markdown) {
  const links = [];
  const tokens = marked.lexer(markdown);
  marked.walkTokens(tokens, (token) => {
    if ((token.type === "link" || token.type === "image") && token.href) {
      links.push({ href: token.href, line: token.raw });
    }
  });
  return links;
}

async function anchorsFor(path, cache) {
  if (cache.has(path)) {
    return cache.get(path);
  }
  const markdown = await readFile(path, "utf8");
  marked.parse(markdown);
  const anchors = new Set(getHeadingList().map(({ id }) => id));
  for (const match of markdown.matchAll(/<a\s+(?:[^>]*?\s)?id=["']([^"']+)["'][^>]*>/gi)) {
    anchors.add(match[1]);
  }
  cache.set(path, anchors);
  return anchors;
}

async function checkLocalLink(sourceFile, href, anchorCache) {
  const { pathname, fragment } = splitHref(href);
  let target = pathname ? resolve(dirname(sourceFile), decode(pathname)) : sourceFile;
  let targetStat = await exists(target);

  if (!targetStat) {
    failures.push({
      file: displayPath(sourceFile),
      href,
      reason: "cible locale absente",
    });
    return;
  }

  if (targetStat.isDirectory()) {
    const indexFile = resolve(target, "index.md");
    if (await exists(indexFile)) {
      target = indexFile;
      targetStat = await exists(target);
    } else if (fragment) {
      failures.push({
        file: displayPath(sourceFile),
        href,
        reason: "impossible de vérifier une ancre sur un dossier",
      });
      return;
    }
  }

  if (fragment && targetStat.isFile() && extname(target).toLowerCase() === ".md") {
    const anchors = await anchorsFor(target, anchorCache);
    if (!anchors.has(fragment)) {
      failures.push({
        file: displayPath(sourceFile),
        href,
        reason: `ancre absente dans ${displayPath(target)}`,
      });
    }
  }
}

async function requestExternalUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "node-gtk-doc link checker" },
    });
    if (response.status === 403 || response.status === 405) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          Range: "bytes=0-0",
          "User-Agent": "node-gtk-doc link checker",
        },
      });
    }
    await response.body?.cancel();
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return {
      error: error.name === "AbortError" ? "délai dépassé" : error.message,
      ok: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkExternalUrl(url) {
  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = await requestExternalUrl(url);
    if (result.ok) {
      return null;
    }

    const retryable =
      result.error ||
      result.status === 429 ||
      (result.status >= 500 && result.status <= 599);
    if (!retryable || attempt === attempts) {
      return result.error ?? `réponse HTTP ${result.status}`;
    }
    await new Promise((done) => setTimeout(done, attempt * 500));
  }
}

async function main() {
  const markdownFiles = (await filesBelow(rootDirectory)).sort();
  const anchorCache = new Map();

  for (const sourceFile of markdownFiles) {
    const markdown = await readFile(sourceFile, "utf8");
    for (const { href } of collectLinks(markdown)) {
      if (/^https?:\/\//i.test(href)) {
        if (!localOnly) {
          if (!externalUrls.has(href)) {
            externalUrls.set(href, []);
          }
          externalUrls.get(href).push(displayPath(sourceFile));
        }
      } else if (!/^(?:mailto:|data:|javascript:)/i.test(href)) {
        await checkLocalLink(sourceFile, href, anchorCache);
      }
    }
  }

  const urls = [...externalUrls.keys()];
  const concurrency = 12;
  for (let index = 0; index < urls.length; index += concurrency) {
    const batch = urls.slice(index, index + concurrency);
    const results = await Promise.all(batch.map((url) => checkExternalUrl(url)));
    results.forEach((reason, batchIndex) => {
      if (reason) {
        const url = batch[batchIndex];
        failures.push({
          file: externalUrls.get(url).join(", "),
          href: url,
          reason,
        });
      }
    });
  }

  const externalSummary = localOnly
    ? "contrôle externe ignoré"
    : `${urls.length} URL externes vérifiées`;
  console.log(`${markdownFiles.length} fichiers Markdown, ${externalSummary}.`);
  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`${failure.file}: ${failure.href} — ${failure.reason}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Tous les liens sont valides.");
  }
}

main().catch((error) => {
  console.error(`Erreur : ${error.message}`);
  process.exitCode = 1;
});
