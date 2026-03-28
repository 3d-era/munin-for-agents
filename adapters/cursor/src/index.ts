import { MuninClient } from "@kalera/munin-sdk";

export function createCursorMuninAdapter(config: {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}) {
  const client = new MuninClient(config);

  return {
    capabilities: () => client.capabilities(),
    store: (projectId: string, payload: Record<string, unknown>) => client.store(projectId, payload),
    retrieve: (projectId: string, payload: Record<string, unknown>) => client.retrieve(projectId, payload),
    search: (projectId: string, payload: Record<string, unknown>) => client.search(projectId, payload),
    list: (projectId: string, payload?: Record<string, unknown>) => client.list(projectId, payload),
    recent: (projectId: string, payload?: Record<string, unknown>) => client.recent(projectId, payload),
  };
}
