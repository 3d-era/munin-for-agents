import { MuninClient } from "@munin/sdk";

export function createGeminiCliMuninAdapter(config: {
  baseUrl: string;
  apiKey?: string;
  project: string;
  timeoutMs?: number;
}) {
  const client = new MuninClient(config);

  return {
    callTool: async (name: string, args: Record<string, unknown>) =>
      client.invoke(name as any, args, { ensureCapability: true }),
    capabilities: () => client.capabilities(),
  };
}

// Ensure defaults for Gemini CLI if run as an extension
const baseUrl = process.env.MUNIN_BASE_URL || "http://127.0.0.1:3237";
const project = process.env.MUNIN_PROJECT || "default";
const apiKey = process.env.MUNIN_API_KEY;

const extensionClient = new MuninClient({ baseUrl, project, apiKey });

export const tools = [
  {
    name: "munin_store_memory",
    description: "Store or update a memory in Munin. Requires a unique key and the content.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "Unique identifier for this memory" },
        content: { type: "string", description: "The content to remember" },
        title: { type: "string", description: "Optional title" },
        tags: { 
          type: "array", 
          items: { type: "string" }, 
          description: "List of tags, e.g. ['planning', 'frontend']"
        }
      },
      required: ["key", "content"],
    },
    execute: async (args: any) => await extensionClient.store(args),
  },
  {
    name: "munin_retrieve_memory",
    description: "Retrieve a memory by its unique key.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "Unique identifier" },
      },
      required: ["key"],
    },
    execute: async (args: any) => await extensionClient.retrieve(args),
  },
  {
    name: "munin_search_memories",
    description: "Search for memories using semantic search or keywords.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        tags: { type: "array", items: { type: "string" } },
        limit: { type: "number", description: "Max results (default: 10)" },
      },
      required: ["query"],
    },
    execute: async (args: any) => await extensionClient.search(args),
  },
  {
    name: "munin_list_memories",
    description: "List all memories with pagination.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number" },
        offset: { type: "number" },
      },
    },
    execute: async (args: any) => await extensionClient.list(args),
  },
  {
    name: "munin_recent_memories",
    description: "Get the most recently updated memories.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number" },
      },
    },
    execute: async (args: any) => await extensionClient.recent(args),
  },
];
