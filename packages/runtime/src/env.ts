import * as fs from "fs";
import * as path from "path";

export interface EnvVar {
  key: string;
  value: string;
}

/**
 * Upsert key=value pairs into a .env file.
 * - Existing keys are replaced.
 * - New keys are appended.
 */
export function writeEnvFile(
  filename: string,
  vars: EnvVar[],
  cwd: string = process.cwd(),
): void {
  const filePath = path.resolve(cwd, filename);
  let lines: string[] = [];

  if (fs.existsSync(filePath)) {
    lines = fs.readFileSync(filePath, "utf8").split("\n");
  }

  for (const { key, value } of vars) {
    const escapedValue = value.replace(/"/g, '\\"');
    const newLine = `${key}="${escapedValue}"`;
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escapedKey}\\s*=.+$`, "m");

    const idx = lines.findIndex((l) => regex.test(l));
    if (idx !== -1) {
      lines[idx] = newLine;
    } else {
      lines.push(newLine);
    }
  }

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}
