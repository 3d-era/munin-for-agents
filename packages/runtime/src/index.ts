export interface ParsedCliArgs {
  action: string;
  payload: Record<string, unknown>;
}

export interface CliEnv {
  baseUrl: string;
  project: string;
  apiKey?: string;
  timeoutMs: number;
  retries: number;
  backoffMs: number;
}

const REDACT_KEYS = ["apiKey", "authorization", "token", "secret", "password"];

export function parseCliArgs(argv: string[], usage: string): ParsedCliArgs {
  const [action, payloadRaw] = argv;
  if (!action) {
    throw new Error(usage);
  }

  if (!payloadRaw) {
    return { action, payload: {} };
  }

  try {
    return {
      action,
      payload: JSON.parse(payloadRaw) as Record<string, unknown>,
    };
  } catch {
    throw new Error("Payload must be valid JSON");
  }
}

export function loadCliEnv(): CliEnv {
  const baseUrl = process.env.MUNIN_BASE_URL;
  if (!baseUrl) {
    throw new Error("MUNIN_BASE_URL is required");
  }

  return {
    baseUrl,
    project: process.env.MUNIN_PROJECT ?? "default",
    apiKey: process.env.MUNIN_API_KEY,
    timeoutMs: Number(process.env.MUNIN_TIMEOUT_MS ?? 15000),
    retries: Number(process.env.MUNIN_RETRIES ?? 3),
    backoffMs: Number(process.env.MUNIN_BACKOFF_MS ?? 300),
  };
}

export async function executeWithRetry<T>(
  task: () => Promise<T>,
  retries: number,
  backoffMs: number,
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      const jitter = Math.floor(Math.random() * 100);
      await sleep(backoffMs * 2 ** attempt + jitter);
      attempt += 1;
    }
  }

  throw lastError;
}

export function safeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: redactText(error.message),
    };
  }

  return { message: redactText(String(error)) };
}

function redactText(text: string): string {
  return REDACT_KEYS.reduce((acc, key) => {
    const pattern = new RegExp(`${key}\\s*[:=]\\s*[^\\s,]+`, "gi");
    return acc.replace(pattern, `${key}=[REDACTED]`);
  }, text);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export * from "./mcp-server.js";
