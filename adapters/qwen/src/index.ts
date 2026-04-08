import { MuninClient } from "@kalera/munin-sdk";
import type { MuninAction } from "@kalera/munin-sdk";

export function createQwenCodeMuninAdapter(config: {
  baseUrl?: string;
  apiKey?: string;
  
}) {
  const client = new MuninClient(config);

  return {
    execute: (projectId: string, action: string, payload: Record<string, unknown>) =>
      client.invoke(projectId, action as MuninAction, payload, { ensureCapability: true }),
    capabilities: () => client.capabilities(),
  };
}
