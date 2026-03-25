import {
  executeWithRetry,
  loadCliEnv,
  parseCliArgs,
  safeError,
} from "@munin/adapter-runtime";
import { createCursorMuninAdapter } from "./index.js";

async function main() {
  try {
    const { action, payload } = parseCliArgs(
      process.argv.slice(2),
      "Usage: munin-cursor <action> [payload-json]",
    );
    const env = loadCliEnv();

    const adapter = createCursorMuninAdapter({
      baseUrl: env.baseUrl,
      apiKey: env.apiKey,
      project: env.project,
      timeoutMs: env.timeoutMs,
    });

    const result = await executeWithRetry(async () => {
      if (action === "capabilities") {
        return { ok: true, data: await adapter.capabilities() };
      }

      const handler = (adapter as Record<string, unknown>)[action];
      if (typeof handler !== "function") {
        throw new Error(`Unsupported action: ${action}`);
      }

      return (handler as (arg: Record<string, unknown>) => Promise<unknown>)(
        payload,
      );
    }, env.retries, env.backoffMs);

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: safeError(error) }));
    process.exitCode = 1;
  }
}

void main();
