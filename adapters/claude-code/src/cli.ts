import {
  executeWithRetry,
  loadCliEnv,
  parseCliArgs,
  safeError,
} from "@munin/adapter-runtime";
import { createClaudeCodeMuninAdapter } from "./index.js";

async function main() {
  try {
    const { action, payload } = parseCliArgs(
      process.argv.slice(2),
      "Usage: munin-claude <action> [payload-json]",
    );
    const env = loadCliEnv();

    const adapter = createClaudeCodeMuninAdapter({
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
