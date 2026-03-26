import { MuninClient } from "@munin/sdk";

export function createQwenCodeMuninAdapter(config: {
  baseUrl: string;
  apiKey?: string;
  project: string;
}) {
  const client = new MuninClient(config);

  return {
    execute: (action: string, payload: Record<string, unknown>) =>
      client.invoke(action as any, payload, { ensureCapability: true }),
    capabilities: () => client.capabilities(),
  };
}
