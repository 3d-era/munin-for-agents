import { MuninClient } from "@kalera/munin-sdk";
import type { MuninAction } from "@kalera/munin-sdk";

export function createGeminiCliMuninAdapter(config: {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}) {
  const baseUrl = (config.baseUrl || "https://munin.kalera.dev").replace(/\/$/, "");
  const client = new MuninClient(config);

  async function fetchPinnedMemories(systemPrompt: string): Promise<string> {
    if (!config.apiKey) return systemPrompt;
    try {
      const response = await fetch(`${baseUrl}/api/memories/pinned`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`[Munin] Failed to fetch pinned memories: ${response.statusText}`);
        return systemPrompt;
      }

      const memories = (await response.json()) as Array<{
        key: string;
        title?: string;
        content: string;
      }>;
      if (!Array.isArray(memories) || memories.length === 0) {
        return systemPrompt;
      }

      const pinnedContext = memories
        .slice(0, 5)
        .map((m) => `[${m.key}] ${m.title ? m.title + ": " : ""}${m.content}`)
        .join("\n\n");

      return `${systemPrompt}\n\n### 📌 PINNED CONTEXT (MANDATORY):\n${pinnedContext}`;
    } catch (error) {
      console.warn(`[Munin] Error fetching pinned memories:`, error);
      return systemPrompt;
    }
  }

  return {
    callTool: async (projectId: string, name: string, args: Record<string, unknown>) =>
      client.invoke(projectId, name as MuninAction, args, { ensureCapability: true }),
    capabilities: () => client.capabilities(),
    beforeAgent: fetchPinnedMemories,
  };
}

// Standalone extension exports — uses process.env directly
const baseUrl = process.env.MUNIN_BASE_URL || "https://munin.kalera.dev";
const apiKey = process.env.MUNIN_API_KEY;
const extensionClient = new MuninClient({ baseUrl, apiKey });

export async function beforeAgent(systemPrompt: string): Promise<string> {
  if (!apiKey) return systemPrompt;
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/memories/pinned`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[Munin] Failed to fetch pinned memories: ${response.statusText}`);
      return systemPrompt;
    }

    const memories = (await response.json()) as Array<{
      key: string;
      title?: string;
      content: string;
    }>;
    if (!Array.isArray(memories) || memories.length === 0) {
      return systemPrompt;
    }

    const pinnedContext = memories
      .slice(0, 5)
      .map((m) => `[${m.key}] ${m.title ? m.title + ": " : ""}${m.content}`)
      .join("\n\n");

    return `${systemPrompt}\n\n### 📌 PINNED CONTEXT (MANDATORY):\n${pinnedContext}`;
  } catch (error) {
    console.warn(`[Munin] Error fetching pinned memories:`, error);
    return systemPrompt;
  }
}

export const tools = [
  {
    name: "munin_store_memory",
    description: "Store or update a memory in Munin. Requires a unique key and the content.",
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "The Munin Project ID (get this from your instructions)" },
        key: { type: "string", description: "Unique identifier for this memory" },
        content: { type: "string", description: "The content to remember" },
        title: { type: "string", description: "Optional title" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "List of tags, e.g. ['planning', 'frontend']",
        },
      },
      required: ["projectId", "key", "content"],
    },
    execute: async (args: Record<string, unknown>) => {
      const { projectId, ...payload } = args;
      if (!projectId) throw new Error("projectId is required");
      return await extensionClient.store(projectId as string, payload);
    },
  },
  {
    name: "munin_retrieve_memory",
    description: "Retrieve a memory by its unique key.",
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "The Munin Project ID" },
        key: { type: "string", description: "Unique identifier" },
      },
      required: ["projectId", "key"],
    },
    execute: async (args: Record<string, unknown>) => {
      const { projectId, ...payload } = args;
      if (!projectId) throw new Error("projectId is required");
      return await extensionClient.retrieve(projectId as string, payload);
    },
  },
  {
    name: "munin_search_memories",
    description: "Search for memories using semantic search or keywords.",
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "The Munin Project ID" },
        query: { type: "string", description: "Search query" },
        tags: { type: "array", items: { type: "string" } },
        limit: { type: "number", description: "Max results (default: 10)" },
      },
      required: ["projectId", "query"],
    },
    execute: async (args: Record<string, unknown>) => {
      const { projectId, ...payload } = args;
      if (!projectId) throw new Error("projectId is required");
      return await extensionClient.search(projectId as string, payload);
    },
  },
  {
    name: "munin_list_memories",
    description: "List all memories with pagination.",
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "The Munin Project ID" },
        limit: { type: "number" },
        offset: { type: "number" },
      },
      required: ["projectId"],
    },
    execute: async (args: Record<string, unknown>) => {
      const { projectId, ...payload } = args;
      if (!projectId) throw new Error("projectId is required");
      return await extensionClient.list(projectId as string, payload);
    },
  },
  {
    name: "munin_recent_memories",
    description: "Get the most recently updated memories.",
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "The Munin Project ID" },
        limit: { type: "number" },
      },
      required: ["projectId"],
    },
    execute: async (args: Record<string, unknown>) => {
      const { projectId, ...payload } = args;
      if (!projectId) throw new Error("projectId is required");
      return await extensionClient.recent(projectId as string, payload);
    },
  },
];
