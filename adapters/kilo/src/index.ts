import { MuninClient } from "@kalera/munin-sdk";

export function createKiloCodeMuninAdapter(config: {
  baseUrl?: string;
  apiKey?: string;
  
}) {
  const client = new MuninClient(config);

  return {
    run: (projectId: string, action: string, payload: Record<string, unknown>) =>
      client.invoke(projectId, action as any, payload, { ensureCapability: true }),
    capabilities: () => client.capabilities(),
  };
}
