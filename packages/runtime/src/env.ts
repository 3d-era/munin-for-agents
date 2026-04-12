import * as fs from "fs";
import * as path from "path";

// Re-export all shared utilities from index.ts (single source of truth)
export {
  parseCliArgs,
  loadCliEnv,
  resolveProjectId,
  executeWithRetry,
  safeError,
} from "./index.js";

export type { ParsedCliArgs, CliEnv } from "./index.js";

export interface EnvVar {
  key: string;
  value: string;
}

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
