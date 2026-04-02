#!/usr/bin/env node
import {
  executeWithRetry,
  loadCliEnv,
  parseCliArgs,
  safeError,
  startMcpServer,
  writeEnvFile,
} from "@kalera/munin-runtime";
import { createClaudeCodeMuninAdapter } from "./index.js";

async function main() {
  try {
    const args = process.argv.slice(2);

    // Start MCP server if requested or empty args
    if (args.length === 0 || args[0] === "mcp") {
      await startMcpServer();
      return;
    }

    // Handle env subcommands: munin-claude env <set|get> <key> [value]
    if (args[0] === "env") {
      const [, subcmd, key, ...rest] = args;

      if (subcmd === "set") {
        if (!key) throw new Error("Usage: munin-claude env set <key> <value>");
        const value = rest.join(" ");
        if (!value) throw new Error("Usage: munin-claude env set <key> <value>");
        writeEnvFile(".env", [{ key, value }]);
        console.log(JSON.stringify({ ok: true, message: `Set ${key} in .env` }));
        return;
      }

      if (subcmd === "get") {
        if (!key) throw new Error("Usage: munin-claude env get <key>");
        // Only support MUNIN_PROJECT for now
        if (key !== "MUNIN_PROJECT") throw new Error("Only MUNIN_PROJECT is supported");
        const { resolveProjectId } = await import("@kalera/munin-runtime");
        const projectId = resolveProjectId();
        console.log(JSON.stringify({ ok: true, key, value: projectId ?? null }));
        return;
      }

      throw new Error("Usage: munin-claude env <set|get> <key> [value]");
    }

    const { action, payload } = parseCliArgs(
      args,
      "Usage: munin-claude <action> [payload-json] OR munin-claude mcp OR munin-claude env <set|get>",
    );
    const env = loadCliEnv();

    const adapter = createClaudeCodeMuninAdapter({
      baseUrl: env.baseUrl,
      apiKey: env.apiKey,
      timeoutMs: env.timeoutMs,
    });

    const result = await executeWithRetry(async () => {
      if (action === "capabilities") {
        return { ok: true, data: await adapter.capabilities() };
      }
      const { projectId, ...p } = payload;
      if (!projectId) throw new Error("projectId required in payload");
      return adapter.execute(projectId as string, action, p);
    }, env.retries, env.backoffMs);

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: safeError(error) }));
    process.exitCode = 1;
  }
}

void main();
