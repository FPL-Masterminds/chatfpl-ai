/**
 * Reverse of scripts/fix-fpl-photo-urls.mjs.
 *
 * That earlier codemod incorrectly switched the whole site from the correct
 * `premierleague25/photos/players/{size}/{code}.png` format to
 * `premierleague/photos/players/{size}/p{code}.png`. The latter path
 * returns images from a stale dataset (old kits, previous clubs, wrong
 * seasons), so we're switching everything back to the official path.
 *
 * From:  premierleague/photos/players/{size}/p{code}.png
 *   To:  premierleague25/photos/players/{size}/{code}.png
 *
 * Filename token may be a template `${...}` or a literal identifier/number,
 * with or without a `p` prefix.
 */
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "public", "scripts", "dist", "out"]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, files);
    else if (EXTS.has(extname(entry))) files.push(p);
  }
  return files;
}

// Match:  resources.premierleague.com/premierleague/photos/players/{size}/{FILENAME}.png
// Capture group 2 is the filename minus any leading `p`. `p` is optional so
// this also cleans up any stragglers written without a prefix.
const RE =
  /resources\.premierleague\.com\/premierleague\/photos\/players\/([0-9]+x[0-9]+)\/p?(\$\{[^}]+\}|[A-Za-z0-9_-]+)\.png/g;

let filesTouched = 0;
let replacements = 0;

for (const file of walk(ROOT)) {
  const original = readFileSync(file, "utf8");
  if (!original.includes("resources.premierleague.com/premierleague/photos/players")) continue;

  const updated = original.replace(RE, (_m, size, name) => {
    replacements += 1;
    return `resources.premierleague.com/premierleague25/photos/players/${size}/${name}.png`;
  });

  if (updated !== original) {
    writeFileSync(file, updated, "utf8");
    filesTouched += 1;
    console.log(`reverted: ${file}`);
  }
}

console.log(`\nDone. Files touched: ${filesTouched}. Replacements: ${replacements}.`);
