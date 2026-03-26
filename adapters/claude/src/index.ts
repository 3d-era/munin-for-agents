import { MuninClient } from "@munin/sdk";

export function createClaudeCodeMuninAdapter(config: {
  baseUrl: string;
  apiKey?: string;
  project: string;
  timeoutMs?: number;
}) {
  const client = new MuninClient(config);

  return {
    execute: async (action: string, payload: Record<string, unknown>) =>
      client.invoke(action as any, payload, { ensureCapability: true }),
    capabilities: () => client.capabilities(),
  };
}
