import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MuninClient } from "@kalera/munin-sdk";
import { loadCliEnv, safeError } from "./index.js";

export function createMcpServerInstance(env: ReturnType<typeof loadCliEnv>) {
  const client = new MuninClient({
    baseUrl: env.baseUrl,
    apiKey: env.apiKey || 'test-key',
    timeoutMs: env.timeoutMs,
  });

  const server = new Server(
    {
      name: "munin-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "munin_store_memory",
          description: "Store or update a memory in Munin Context Core. It will automatically use the active project from environment if projectId is omitted. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. Only use if cross-saving to a different Context Core ID." },
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
        },
        {
          name: "munin_retrieve_memory",
          description: "Retrieve a memory by its unique key from the current Munin Context Core. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. The Munin Context Core ID." },
              key: { type: "string", description: "Unique identifier" },
            },
            required: ["key"],
          },
        },
        {
          name: "munin_search_memories",
          description: "Search for memories using semantic search or keywords. Returns formatted, token-efficient GraphRAG context. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. The Munin Context Core ID." },
              query: { type: "string", description: "Search query" },
              tags: { type: "array", items: { type: "string" } },
              limit: { type: "number", description: "Max results (default: 10)" },
            },
            required: ["query"],
          },
        },
        {
          name: "munin_list_memories",
          description: "List all memories with pagination. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. The Munin Context Core ID." },
              limit: { type: "number" },
              offset: { type: "number" },
            },
            required: [],
          },
        },
        {
          name: "munin_recent_memories",
          description: "Get the most recently updated memories. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. The Munin Context Core ID." },
              limit: { type: "number" },
            },
            required: [],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const args = request.params.arguments || {};
      const projectId = (args.projectId as string) || process.env.MUNIN_PROJECT;
      
      if (!projectId) {
        throw new Error("projectId is required in arguments or MUNIN_PROJECT environment variable");
      }

      // Remove projectId from args before sending as payload
      const { projectId: _ignored, ...payload } = args;

      let result;

      switch (request.params.name) {
        case "munin_store_memory":
          result = await client.store(projectId, payload);
          break;
        case "munin_retrieve_memory":
          result = await client.retrieve(projectId, payload);
          break;
        case "munin_search_memories":
          result = await client.search(projectId, payload);
          break;
        case "munin_list_memories":
          result = await client.list(projectId, payload);
          break;
        case "munin_recent_memories":
          result = await client.recent(projectId, payload);
          break;
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errObj = safeError(error);
      return {
        content: [
          {
            type: "text",
            text: `Error executing tool: ${JSON.stringify(errObj)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function startMcpServer() {
  const env = loadCliEnv();
  const server = createMcpServerInstance(env);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Munin MCP Server running on stdio");
}