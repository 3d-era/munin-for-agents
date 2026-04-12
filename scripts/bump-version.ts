#!/usr/bin/env npx tsx
/**
 * bump-version.ts — Single source of truth version bump for the entire Munin ecosystem.
 *
 * Usage:
 *   node scripts/bump-version.ts <new-version>
 *   node scripts/bump-version.ts 1.2.9
 *
 * What it does:
 *   1. Update packages/shared-version/src/index.ts (the SINGLE SOURCE)
 *   2. Grep/replace ALL hardcoded version strings in source files
 *   3. Update ALL package.json versions (workspace packages + adapters)
 *   4. Print summary of changed files
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ROOT = __dirname;
const NEW_VERSION = process.argv[2];

if (!NEW_VERSION) {
  console.error("Usage: node scripts/bump-version.ts <new-version>");
  console.error("Example: node scripts/bump-version.ts 1.2.9");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(NEW_VERSION)) {
  console.error(`Invalid version format: ${NEW_VERSION} (expected x.y.z)`);
  process.exit(1);
}

// ─── 1. Update shared-version (SINGLE SOURCE OF TRUTH) ─────────────────────────
const sharedVersionFile = path.join(ROOT, "packages/shared-version/src/index.ts");
const sharedVersionSrc = fs.readFileSync(sharedVersionFile, "utf8");
const updatedSharedVersion = sharedVersionSrc.replace(
  /export const VERSION = "[\d.]+";/,
  `export const VERSION = "${NEW_VERSION}";`
);
fs.writeFileSync(sharedVersionFile, updatedSharedVersion);
console.log(`✅ Updated packages/shared-version/src/index.ts → ${NEW_VERSION}`);

// ─── 2. Grep/replace hardcoded version strings in source files ──────────────────
const VERSION_PATTERNS = [
  /"1\.2\.[0-7]"/g,  // match 1.2.0 – 1.2.9
  /"1\.0\.0"/g,
  /"0\.0\.1"/g,
];

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".json"];

function findSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSourceFiles(full));
    } else if (SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

const changedFiles: string[] = [];
const allFiles = findSourceFiles(ROOT);

for (const file of allFiles) {
  // Skip shared-version itself (already updated above)
  if (file.includes("packages/shared-version/src/index.ts")) continue;

  let content = fs.readFileSync(file, "utf8");
  let modified = false;

  for (const pattern of VERSION_PATTERNS) {
    const newContent = content.replace(pattern, `"${NEW_VERSION}"`);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  // Also replace SERVER_VERSION values
  content = content.replace(
    /serverVersion:\s*"[\d.]+"/g,
    `serverVersion: "${NEW_VERSION}"`
  );

  if (modified) {
    fs.writeFileSync(file, content);
    changedFiles.push(path.relative(ROOT, file));
  }
}

if (changedFiles.length > 0) {
  console.log(`✅ Updated ${changedFiles.length} source file(s):`);
  for (const f of changedFiles) console.log(`   - ${f}`);
} else {
  console.log("ℹ️  No hardcoded version strings found in source files");
}

// ─── 3. Update ALL package.json versions ──────────────────────────────────────
function updatePackageJson(file: string): boolean {
  try {
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    if (typeof pkg.version !== "string") return false;

    const oldVersion = pkg.version;
    pkg.version = NEW_VERSION;

    // Update dependencies peerDependencies that reference @kalera/munin-*
    const depTypes = ["dependencies", "devDependencies", "peerDependencies"] as const;
    for (const depType of depTypes) {
      if (!pkg[depType]) continue;
      for (const [key, val] of Object.entries(pkg[depType])) {
        if (
          typeof val === "string" &&
          (key.startsWith("@kalera/munin-") || key === "munin-ecosystem")
        ) {
          // Keep workspace:* or file: refs, only update semver refs
          if (/^\^?[\d]/.test(val)) {
            pkg[depType][key] = `^${NEW_VERSION}`;
          }
        }
      }
    }

    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`✅ Updated ${path.relative(ROOT, file)}: ${oldVersion} → ${NEW_VERSION}`);
    return true;
  } catch {
    return false;
  }
}

const pkgFiles = findSourceFiles(ROOT).filter((f) => path.basename(f) === "package.json");
let updatedPkgs = 0;
for (const f of pkgFiles) {
  if (updatePackageJson(f)) updatedPkgs++;
}
console.log(`✅ Updated ${updatedPkgs} package.json(s)`);

// ─── 4. Print summary ─────────────────────────────────────────────────────────
console.log(`\n📦 Version bumped to ${NEW_VERSION}`);
console.log("Next steps:");
console.log("  1. Run: pnpm install && pnpm run build");
console.log("  2. Test your changes");
console.log("  3. Commit & push");
