import { MuninClient } from "@kalera/munin-sdk";
import type { MuninAction } from "@kalera/munin-sdk";

export function createAntigravityMuninAdapter(config: {
  baseUrl?: string;
  apiKey?: string;
  
  timeoutMs?: number;
}) {
  const client = new MuninClient(config);

  return {
    invokeTool: (projectId: string, action: string, payload: Record<string, unknown>) =>
      client.invoke(projectId, action as MuninAction, payload, { ensureCapability: true }),
    capabilities: () => client.capabilities(),
  };
}
