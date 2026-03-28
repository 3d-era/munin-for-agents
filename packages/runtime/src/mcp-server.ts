import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MuninClient } from "@kalera/munin-sdk";
import { loadCliEnv, safeError } from "./index.js";

export async function startMcpServer() {
  const env = loadCliEnv();

  const client = new MuninClient({
    baseUrl: env.baseUrl,
    apiKey: env.apiKey,
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
          description: "Store or update a memory in Munin. Requires a unique key and the content.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "The Munin Project ID (get this from your workspace rules/instructions)" },
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
        },
        {
          name: "munin_retrieve_memory",
          description: "Retrieve a memory by its unique key.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "The Munin Project ID" },
              key: { type: "string", description: "Unique identifier" },
            },
            required: ["projectId", "key"],
          },
        },
        {
          name: "munin_search_memories",
          description: "Search for memories using semantic search or keywords.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "The Munin Project ID" },
              query: { type: "string", description: "Search query" },
              tags: { type: "array", items: { type: "string" } },
              limit: { type: "number", description: "Max results (default: 10)" },
            },
            required: ["projectId", "query"],
          },
        },
        {
          name: "munin_list_memories",
          description: "List all memories with pagination.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "The Munin Project ID" },
              limit: { type: "number" },
              offset: { type: "number" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "munin_recent_memories",
          description: "Get the most recently updated memories.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "The Munin Project ID" },
              limit: { type: "number" },
            },
            required: ["projectId"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const args = request.params.arguments || {};
      const projectId = args.projectId as string;
      
      if (!projectId) {
        throw new Error("projectId is required");
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Munin MCP Server running on stdio");
}