#!/usr/bin/env node
import { startMcpServer } from "@kalera/munin-runtime";
import { realpathSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

async function main() {
  // Check if we are imported as a module or run directly (CJS-safe).
  //
  // Two platform-specific issues require this approach:
  //   1. Unix/macOS: npm bin entries are symlinks. import.meta.url resolves to
  //      the real file path while process.argv[1] is the symlink path — they
  //      never match without realpathSync.
  //   2. Windows: import.meta.url is a file URL (file:///C:/...) while
  //      process.argv[1] is a Windows path (C:\...). Naive string concat of
  //      `file://${process.argv[1]}` produces an invalid URL that never matches.
  //      fileURLToPath() normalises both sides to the same format. Windows paths
  //      are also case-insensitive, so the final comparison is lowercased there.
  let isImported = false;
  if (typeof import.meta !== "undefined") {
    try {
      const realModule = resolve(realpathSync(fileURLToPath(import.meta.url)));
      const realEntry  = resolve(realpathSync(process.argv[1]));
      isImported = process.platform === "win32"
        ? realModule.toLowerCase() !== realEntry.toLowerCase()
        : realModule !== realEntry;
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
