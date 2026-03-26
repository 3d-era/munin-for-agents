import { MuninClient } from "@kalera/munin-sdk";

export function createAntigravityMuninAdapter(config: {
  baseUrl: string;
  apiKey?: string;
  project: string;
  timeoutMs?: number;
}) {
  const client = new MuninClient(config);

  return {
    invokeTool: (action: string, payload: Record<string, unknown>) =>
      client.invoke(action as any, payload, { ensureCapability: true }),
    capabilities: () => client.capabilities(),
  };
}
