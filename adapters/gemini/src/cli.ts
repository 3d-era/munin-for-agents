import {
  executeWithRetry,
  loadCliEnv,
  parseCliArgs,
  safeError,
} from "@kalera/munin-runtime";
import { createGeminiCliMuninAdapter } from "./index.js";

async function main() {
  try {
    const { action, payload } = parseCliArgs(
      process.argv.slice(2),
      "Usage: munin-gemini <tool-name> [payload-json]",
    );
    const env = loadCliEnv();

    const adapter = createGeminiCliMuninAdapter({
      baseUrl: env.baseUrl,
      apiKey: env.apiKey,
      
      timeoutMs: env.timeoutMs,
    });

    const result = await executeWithRetry(async () => {
      if (action === "capabilities") {
        return { ok: true, data: await adapter.capabilities() };
      }
      const { projectId, ...p } = payload; if (!projectId) throw new Error("projectId required in payload"); return adapter.callTool(projectId as string, action, p);
    }, env.retries, env.backoffMs);

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: safeError(error) }));
    process.exitCode = 1;
  }
}

void main();
