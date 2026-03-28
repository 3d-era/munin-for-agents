import { MuninClient } from "@kalera/munin-sdk";

export function createGeminiCliMuninAdapter(config: {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}) {
  const client = new MuninClient(config);

  return {
    callTool: async (projectId: string, name: string, args: Record<string, unknown>) =>
      client.invoke(projectId, name as any, args, { ensureCapability: true }),
    capabilities: () => client.capabilities(),
  };
}

// Ensure defaults for Gemini CLI if run as an extension
const baseUrl = process.env.MUNIN_BASE_URL || "http://127.0.0.1:3237";
const apiKey = process.env.MUNIN_API_KEY;

const extensionClient = new MuninClient({ baseUrl, apiKey });

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
          description: "List of tags, e.g. ['planning', 'frontend']"
        }
      },
      required: ["projectId", "key", "content"],
    },
    execute: async (args: any) => {
      const { projectId, ...payload } = args;
      if (!projectId) throw new Error("projectId is required");
      return await extensionClient.store(projectId, payload);
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
    execute: async (args: any) => {
      const { projectId, ...payload } = args;
      if (!projectId) throw new Error("projectId is required");
      return await extensionClient.retrieve(projectId, payload);
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
    execute: async (args: any) => {
      const { projectId, ...payload } = args;
      if (!projectId) throw new Error("projectId is required");
      return await extensionClient.search(projectId, payload);
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
      required: ["projectId"]
    },
    execute: async (args: any) => {
      const { projectId, ...payload } = args;
      if (!projectId) throw new Error("projectId is required");
      return await extensionClient.list(projectId, payload);
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
      required: ["projectId"]
    },
    execute: async (args: any) => {
      const { projectId, ...payload } = args;
      if (!projectId) throw new Error("projectId is required");
      return await extensionClient.recent(projectId, payload);
    },
  },
];
