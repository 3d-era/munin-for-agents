import type { MuninClient } from "../../../packages/ts-sdk/src/client";

export interface ContractResult {
  name: string;
  passed: boolean;
  message?: string;
}

export async function runCoreActionSuite(
  client: MuninClient,
): Promise<ContractResult[]> {
  const results: ContractResult[] = [];

  try {
    const caps = await client.capabilities();
    const required = ["store", "retrieve", "search", "list", "recent"];
    const missing = required.filter(
      (action) =>
        !caps.actions.core.includes(action) &&
        !caps.actions.optional.includes(action),
    );

    results.push({
      name: "capabilities-core-actions",
      passed: missing.length === 0,
      message:
        missing.length > 0
          ? `Missing actions: ${missing.join(", ")}`
          : "All required actions advertised",
    });
  } catch (error) {
    results.push({
      name: "capabilities-core-actions",
      passed: false,
      message: `Capabilities request failed: ${String(error)}`,
    });
    return results;
  }

  try {
    await client.list({ limit: 1 });
    results.push({
      name: "list-action-smoke",
      passed: true,
      message: "list action succeeded",
    });
  } catch (error) {
    results.push({
      name: "list-action-smoke",
      passed: false,
      message: `list action failed: ${String(error)}`,
    });
  }

  return results;
}
