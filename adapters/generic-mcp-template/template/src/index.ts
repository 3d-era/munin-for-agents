import { MuninClient } from "@munin/sdk";

export function createMuninAdapter(config: {
  baseUrl: string;
  apiKey?: string;
  project: string;
}) {
  const client = new MuninClient(config);

  return {
    capabilities: () => client.capabilities(),
    execute: (action: string, payload: Record<string, unknown>) =>
      client.invoke(action as any, payload, { ensureCapability: true }),
  };
}
