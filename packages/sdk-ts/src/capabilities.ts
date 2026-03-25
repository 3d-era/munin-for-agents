import type { MuninCapabilities, MuninResponse } from "./types.js";
import { MuninSdkError, MuninTransportError } from "./errors.js";

export async function fetchCapabilities(
  baseUrl: string,
  apiKey?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<MuninCapabilities> {
  const response = await fetchImpl(`${baseUrl}/api/mcp/capabilities`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
  }).catch((error: unknown) => {
    throw new MuninTransportError(
      `Failed to call capabilities endpoint: ${String(error)}`,
    );
  });

  if (!response.ok) {
    throw new MuninTransportError(
      `Capabilities request failed with status ${response.status}`,
    );
  }

  const body = (await response.json()) as MuninResponse<MuninCapabilities>;

  if (!body.ok || !body.data) {
    throw new MuninSdkError(
      body.error ?? {
        code: "INTERNAL_ERROR",
        message: "Capabilities response missing data",
      },
    );
  }

  return body.data;
}

export function isActionSupported(
  capabilities: MuninCapabilities,
  action: string,
): boolean {
  return (
    capabilities.actions.core.includes(action) ||
    capabilities.actions.optional.includes(action)
  );
}
