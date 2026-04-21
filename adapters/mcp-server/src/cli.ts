#!/usr/bin/env node
import { startMcpServer } from "@kalera/munin-runtime";
import { realpathSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

async function main(): Promise<void> {
  // Detect whether this module is being imported vs. run directly.
  //
  // Two platform-specific issues require this approach:
  //   1. Unix/macOS: npm bin entries are symlinks. import.meta.url resolves to
  //      the real file path while process.argv[1] is the symlink path — they
  //      never match without realpathSync.
  //   2. Windows: import.meta.url is a file URL (file:///C:/...) while
  //      process.argv[1] is a Windows path (C:\...). fileURLToPath() normalises
  //      both sides. Windows paths are case-insensitive, so the final compare
  //      is lowercased there.
  let isImported = false;
  if (typeof import.meta !== "undefined" && process.argv[1]) {
    try {
      const realModule = resolve(realpathSync(fileURLToPath(import.meta.url)));
      const realEntry = resolve(realpathSync(process.argv[1]));
      isImported = process.platform === "win32"
        ? realModule.toLowerCase() !== realEntry.toLowerCase()
        : realModule !== realEntry;
    } catch (err) {
      // Fall through to "run directly" — the safe default. Surface the cause
      // when MUNIN_DEBUG is set so users on exotic environments (bundlers,
      // missing entry script, permission issues) can diagnose the failure.
      if (process.env.MUNIN_DEBUG) {
        console.error("[munin-mcp] isImported detection failed:", err);
      }
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
