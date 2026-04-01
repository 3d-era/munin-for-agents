#!/usr/bin/env node
import { startMcpServer, createMcpServerInstance } from "@kalera/munin-runtime";

export function createSandboxServer() {
  // Use mock config to allow Smithery to scan the tools without real credentials
  return createMcpServerInstance({
    baseUrl: "https://munin.kalera.dev",
    apiKey: "smithery-scan-key",
    timeoutMs: 10000,
    retries: 0,
    backoffMs: 0
  });
}

async function main() {
  // Check if we are imported as a module or run directly
  const isImported = import.meta.url !== `file://${process.argv[1]}`;
  if (isImported) return;

  try {
    await startMcpServer();
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exitCode = 1;
  }
}

void main();