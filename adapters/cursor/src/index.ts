import { MuninClient } from "@munin/sdk";

export function createCursorMuninAdapter(config: {
  baseUrl: string;
  apiKey?: string;
  project: string;
  timeoutMs?: number;
}) {
  const client = new MuninClient(config);

  return {
    capabilities: () => client.capabilities(),
    store: (payload: Record<string, unknown>) => client.store(payload),
    retrieve: (payload: Record<string, unknown>) => client.retrieve(payload),
    search: (payload: Record<string, unknown>) => client.search(payload),
    list: (payload?: Record<string, unknown>) => client.list(payload),
    recent: (payload?: Record<string, unknown>) => client.recent(payload),
  };
}
