#!/usr/bin/env node
import { startMcpServer, createMcpServerInstance } from "@kalera/munin-runtime";

export function createSandboxServer() {
  // Use mock config to allow Smithery to scan the tools without real credentials.
  // allowMissingApiKey bypasses the MUNIN_API_KEY requirement for schema-discovery scans.
  return createMcpServerInstance(
    {
      baseUrl: "https://munin.kalera.dev",
      apiKey: process.env.MUNIN_SMITHERY_SCAN_KEY,
      timeoutMs: 10000,
      retries: 0,
      backoffMs: 0,
    },
    { allowMissingApiKey: true },
  );
}

async function main() {
  // Check if we are imported as a module or run directly (CJS-safe)
  const isImported =
    typeof import.meta !== "undefined" &&
    import.meta.url !== `file://${process.argv[1]}`;
  if (isImported) return;

  try {
    await startMcpServer();
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exitCode = 1;
  }
}

void main();