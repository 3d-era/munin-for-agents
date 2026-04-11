import * as fs from "fs";
import * as path from "path";

export interface EnvVar {
  key: string;
  value: string;
}

const REDACT_KEYS = ["apiKey", "authorization", "token", "secret", "password"];

/**
 * Resolve the encryption key for E2EE projects from MUNIN_ENCRYPTION_KEY env var.
 */
export function resolveEncryptionKey(): string | undefined {
  return process.env.MUNIN_ENCRYPTION_KEY;
}

/**
 * Escape shell/metacharacters that could inject into a .env value.
 * Escapes: $, backticks, \, and newlines — in addition to double quotes.
 */
function escapeEnvValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")       // escape backslashes first
    .replace(/\n/g, "\\n")       // escape newlines
    .replace(/\r/g, "\\r")       // escape carriage returns
    .replace(/`/g, "\\`")        // escape backticks
    .replace(/\$/g, "\\$")       // escape dollar signs
    .replace(/"/g, '\\"');       // escape double quotes
}

/**
 * Parse a .env line, returning { key, value } or null if not a valid assignment.
 * Uses a string-based split instead of regex to avoid injection from .env content.
 */
function parseEnvLine(line: string): EnvVar | null {
  // Skip empty lines and comments
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) return null;

  const key = trimmed.slice(0, eqIndex).trim();
  // Value is everything after the first '=' (unquoted, no regex)
  const rawValue = trimmed.slice(eqIndex + 1);

  return { key, value: rawValue };
}

/**
 * Upsert key=value pairs into a .env file.
 * - Existing keys are replaced.
 * - New keys are appended.
 * - Keys are matched via string split (not regex) to prevent injection.
 */
export function writeEnvFile(
  filename: string,
  vars: EnvVar[],
  cwd: string = process.cwd(),
): void {
  const filePath = path.resolve(cwd, filename);
  const lines: string[] = [];

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const parsed = parseEnvLine(line);
      // Remove lines that match any key we're about to upsert
      if (parsed && vars.some((v) => v.key === parsed.key)) continue;
      lines.push(line);
    }
  }

  for (const { key, value } of vars) {
    const escapedValue = escapeEnvValue(value);
    lines.push(`${key}="${escapedValue}"`);
  }

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

/**
 * Safe numeric env parser: returns defaultVal if value is missing or NaN.
 */
function safeParseInt(envVal: string | undefined, defaultVal: number): number {
  if (envVal === undefined) return defaultVal;
  const parsed = Number(envVal);
  if (isNaN(parsed)) return defaultVal;
  return parsed;
}

/**
 * Walk up the directory tree from `startDir` (default CWD) toward root,
 * searching each ancestor for `filename`. Returns the value of the first match.
 * Stops at filesystem root or when a `.git` dir is found (project boundary).
 */
function resolveEnvFileUpward(filename: string, startDir?: string): string | undefined {
  let current = startDir ?? process.cwd();
  let last = "";

  while (current !== last) {
    last = current;
    const filePath = path.join(current, filename);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("MUNIN_PROJECT=")) continue;
          return trimmed.slice("MUNIN_PROJECT=".length).trim();
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(`[munin-runtime] Failed to read ${filePath}:`, error);
      }
    }

    // Stop at git root (project boundary)
    if (fs.existsSync(path.join(current, ".git"))) break;

    current = path.dirname(current);
  }
  return undefined;
}

/**
 * Resolve MUNIN_PROJECT from multiple sources, in priority order:
 * 1. Explicit environment variable
 * 2. .env.local in any ancestor directory (walk-up from CWD)
 * 3. .env in any ancestor directory (walk-up from CWD)
 */
export function resolveProjectId(): string | undefined {
  // 1. Explicit env var (highest priority)
  if (process.env.MUNIN_PROJECT) {
    return process.env.MUNIN_PROJECT;
  }

  // 2. Walk upward from CWD — find .env.local in any ancestor dir
  const fromLocal = resolveEnvFileUpward(".env.local");
  if (fromLocal) return fromLocal;

  // 3. Walk upward from CWD — find .env in any ancestor dir
  const fromEnv = resolveEnvFileUpward(".env");
  if (fromEnv) return fromEnv;

  return undefined;
}

export interface CliEnv {
  baseUrl: string;
  apiKey: string | undefined;
  timeoutMs: number;
  retries: number;
  backoffMs: number;
}

export function loadCliEnv(): CliEnv {
  return {
    baseUrl: process.env.MUNIN_BASE_URL || "https://munin.kalera.dev",
    apiKey: process.env.MUNIN_API_KEY,
    timeoutMs: safeParseInt(process.env.MUNIN_TIMEOUT_MS, 15_000),
    retries: safeParseInt(process.env.MUNIN_RETRIES, 3),
    backoffMs: safeParseInt(process.env.MUNIN_BACKOFF_MS, 300),
  };
}

export async function executeWithRetry<T>(
  task: () => Promise<T>,
  retries: number,
  backoffMs: number,
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < retries) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= retries) break;
      const jitter = Math.floor(Math.random() * 100);
      await sleep(backoffMs * 2 ** attempt + jitter);
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
    // Replace key=value patterns with key=[REDACTED] using simple string split
    let result = acc;
    let idx = result.indexOf(`${key}=`);
    while (idx !== -1) {
      const endIdx = result.indexOf(/[\s,;]/.test(result[idx + key.length + 1] ?? "")
        ? result[idx + key.length + 1]
        : "");
      const end = endIdx === -1 ? result.length : endIdx;
      const before = result.slice(0, idx + key.length + 1);
      const after = result.slice(end);
      result = `${before}[REDACTED]${after}`;
      idx = result.indexOf(`${key}=`, idx + key.length + 1);
    }
    return result;
  }, text);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseCliArgs(argv: string[], usage: string): { action: string; payload: Record<string, unknown> } {
  const [action, payloadRaw] = argv;
  if (!action) throw new Error(usage);
  if (!payloadRaw) return { action, payload: {} };
  try {
    return { action, payload: JSON.parse(payloadRaw) as Record<string, unknown> };
  } catch {
    throw new Error("Payload must be valid JSON");
  }
}

export * from "./mcp-server.js";