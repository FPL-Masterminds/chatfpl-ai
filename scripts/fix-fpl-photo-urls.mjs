/**
 * One-off codemod: fix broken FPL player photo URLs across the codebase.
 *
 * Before (broken on 2026/27 season, returns 403):
 *   https://resources.premierleague.com/premierleague25/photos/players/{size}/{code}.png
 *
 * After (verified live against Premier League CDN):
 *   https://resources.premierleague.com/premierleague/photos/players/{size}/p{code}.png
 *
 * Also handles hardcoded photo lookups where the trailing `.png` is preceded by
 * a template expression like `${code}.png` or a bare number like `223094.png`.
 *
 * Does not touch team badge URLs (they use a different, still-working path).
 */
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { readdirSync } from "node:fs";
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

/**
 * Matches: resources.premierleague.com/premierleague25/photos/players/{size}/{FILENAME}.png
 *   where FILENAME can be a template expression `${...}` OR a literal identifier/number.
 * Captures:
 *   1 = size folder (e.g. "110x140" or "250x250")
 *   2 = filename token (with or without `${...}`)
 */
const PHOTO_RE =
  /resources\.premierleague\.com\/premierleague25\/photos\/players\/([0-9]+x[0-9]+)\/(\$\{[^}]+\}|[A-Za-z0-9_-]+)\.png/g;

let filesTouched = 0;
let replacements = 0;

for (const file of walk(ROOT)) {
  const original = readFileSync(file, "utf8");
  if (!original.includes("premierleague25")) continue;

  const updated = original.replace(PHOTO_RE, (_m, size, name) => {
    replacements += 1;
    return `resources.premierleague.com/premierleague/photos/players/${size}/p${name}.png`;
  });

  if (updated !== original) {
    writeFileSync(file, updated, "utf8");
    filesTouched += 1;
    console.log(`fixed: ${file}`);
  }
}

console.log(`\nDone. Files touched: ${filesTouched}. Replacements: ${replacements}.`);
