import { MuninClient } from "munin/sdk/dist/index.js";

export function createKiloCodeMuninAdapter(config: {
  baseUrl: string;
  apiKey?: string;
  project: string;
}) {
  const client = new MuninClient(config);

  return {
    run: (action: string, payload: Record<string, unknown>) =>
      client.invoke(action as any, payload, { ensureCapability: true }),
    capabilities: () => client.capabilities(),
  };
}
