import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MuninClient } from "@munin/sdk/dist/index.js";
import { loadCliEnv, safeError } from "./index.js";

export async function startMcpServer() {
  const env = loadCliEnv();

  const client = new MuninClient({
    baseUrl: env.baseUrl,
    project: env.project,
    apiKey: env.apiKey,
    timeoutMs: env.timeoutMs,
  });

  const server = new Server(
    {
      name: "munin-mcp-server",
      version: "0.1.0",
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
          description: "Store or update a memory in Munin. Requires a unique key and the content.",
          inputSchema: {
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
        },
        {
          name: "munin_retrieve_memory",
          description: "Retrieve a memory by its unique key.",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Unique identifier" },
            },
            required: ["key"],
          },
        },
        {
          name: "munin_search_memories",
          description: "Search for memories using semantic search or keywords.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              tags: { type: "array", items: { type: "string" } },
              limit: { type: "number", description: "Max results (default: 10)" },
            },
            required: ["query"],
          },
        },
        {
          name: "munin_list_memories",
          description: "List all memories with pagination.",
          inputSchema: {
            type: "object",
            properties: {
              limit: { type: "number" },
              offset: { type: "number" },
            },
          },
        },
        {
          name: "munin_recent_memories",
          description: "Get the most recently updated memories.",
          inputSchema: {
            type: "object",
            properties: {
              limit: { type: "number" },
            },
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const args = request.params.arguments || {};
      let result;

      switch (request.params.name) {
        case "munin_store_memory":
          result = await client.store(args);
          break;
        case "munin_retrieve_memory":
          result = await client.retrieve(args);
          break;
        case "munin_search_memories":
          result = await client.search(args);
          break;
        case "munin_list_memories":
          result = await client.list(args);
          break;
        case "munin_recent_memories":
          result = await client.recent(args);
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Munin MCP Server running on stdio");
}