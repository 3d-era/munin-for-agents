#!/usr/bin/env node
import { startMcpServer } from "@kalera/munin-runtime";

async function main() {
  try {
    await startMcpServer();
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exitCode = 1;
  }
}

void main();