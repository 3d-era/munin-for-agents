import {
  executeWithRetry,
  loadCliEnv,
  parseCliArgs,
  safeError,
  startMcpServer,
} from "munin/runtime/dist/index.js";
import { createOpenClawMuninAdapter } from "./index.js";

async function main() {
  try {
    const args = process.argv.slice(2);
    
    // If no arguments, or 'mcp' is passed, start as MCP server
    if (args.length === 0 || args[0] === 'mcp') {
      await startMcpServer();
      return;
    }

    const { action, payload } = parseCliArgs(
      args,
      "Usage: munin-openclaw <action> [payload-json] OR munin-openclaw mcp",
    );
    const env = loadCliEnv();

    const adapter = createOpenClawMuninAdapter({
      baseUrl: env.baseUrl,
      apiKey: env.apiKey,
      project: env.project,
      timeoutMs: env.timeoutMs,
    });

    const result = await executeWithRetry(async () => {
      if (action === "capabilities") {
        return { ok: true, data: await adapter.capabilities() };
      }
      return adapter.execute(action, payload);
    }, env.retries, env.backoffMs);

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: safeError(error) }));
    process.exitCode = 1;
  }
}

void main();
