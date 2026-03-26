import { MuninClient } from "@munin/sdk";

export function createOpenClawMuninAdapter(config: {
  baseUrl: string;
  apiKey?: string;
  project: string;
  timeoutMs?: number;
}) {
  const client = new MuninClient(config);

  return {
    execute: (action: string, payload: Record<string, unknown>) =>
      client.invoke(action as any, payload, { ensureCapability: true }),
    capabilities: () => client.capabilities(),
  };
}
