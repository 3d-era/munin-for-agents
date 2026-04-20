#!/usr/bin/env node
import { startMcpServer } from "@kalera/munin-runtime";
import { realpathSync } from "fs";
import { fileURLToPath } from "url";

async function main() {
  // Check if we are imported as a module or run directly (CJS-safe).
  // Resolve symlinks on process.argv[1] before comparing — npm bins are symlinks,
  // and import.meta.url always reflects the real file path, causing a mismatch
  // that incorrectly sets isImported=true and exits the process immediately.
  let isImported = false;
  if (typeof import.meta !== "undefined") {
    try {
      const realEntry = realpathSync(process.argv[1]);
      const realModule = fileURLToPath(import.meta.url);
      isImported = realModule !== realEntry;
    } catch {
      isImported = false;
    }
  }
  if (isImported) return;

  try {
    await startMcpServer();
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exitCode = 1;
  }
}

void main();
