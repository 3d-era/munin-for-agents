import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MuninClient } from "@kalera/munin-sdk";
import { loadCliEnv, resolveProjectId, resolveEncryptionKey, safeError } from "./index.js";

export function createMcpServerInstance(
  env: ReturnType<typeof loadCliEnv>,
  opts?: { allowMissingApiKey?: boolean },
) {
  if (!env.apiKey && !opts?.allowMissingApiKey) {
    throw new Error(
      "MUNIN_API_KEY is required. Set it in your environment, or in a .env.local / .env file in your project directory (walked up automatically).",
    );
  }

  const client = new MuninClient({
    baseUrl: env.baseUrl,
    apiKey: env.apiKey,
    timeoutMs: env.timeoutMs,
  });

  const server = new Server(
    {
      name: "munin-mcp-server",
      version: "1.3.0",
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
          description: "Search for memories using semantic search or keywords. Returns formatted, token-efficient GraphRAG context. Supports pagination with topK/offset and optional total count. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. The Munin Context Core ID." },
              query: { type: "string", description: "Search query" },
              tags: { type: "array", items: { type: "string" } },
              topK: { type: "number", description: "Max results to return (default: 10, max: 50)" },
              offset: { type: "number", description: "Pagination offset for fetching more results (default: 0)" },
              includeTotal: { type: "boolean", description: "If true, includes total count in response (default: false)" },
            },
            required: ["query"],
          },
        },
        {
          name: "munin_list_memories",
          description: "List all memories with pagination support. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. The Munin Context Core ID." },
              limit: { type: "number", description: "Max results to return (default: 10, max: 100)" },
              offset: { type: "number", description: "Pagination offset (default: 0)" },
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
        {
          name: "munin_share_memory",
          description: "Share one or more memories to other projects owned by the same user. The target project must share the same Hash Key to read encrypted content. Requires Pro or Elite tier. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. The source project ID." },
              memoryIds: {
                type: "array",
                items: { type: "string" },
                description: "Array of memory IDs to share",
              },
              targetProjectIds: {
                type: "array",
                items: { type: "string" },
                description: "Array of target project IDs to share memories into",
              },
            },
            required: ["memoryIds", "targetProjectIds"],
          },
        },
        {
          name: "munin_get_project_info",
          description: "Get current project metadata including E2EE status, tier features, and limits. CRITICAL: Before storing or retrieving memories in an E2EE project, verify the encryption key is set correctly. Shows whether MUNIN_ENCRYPTION_KEY is configured. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. Defaults to active project." },
            },
            required: [],
          },
        },
        {
          name: "munin_versions",
          description: "List all versions of a memory (version history). Use this to review past changes before rolling back. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. Defaults to active project." },
              key: { type: "string", description: "Memory key (provide this OR id, not both)" },
              id: { type: "string", description: "Memory ID (provide this OR key, not both)" },
            },
            required: ["key"],
          },
        },
        {
          name: "munin_rollback",
          description: "Rollback a memory to a previous version. Run munin_versions first to find the version number. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. Defaults to active project." },
              key: { type: "string", description: "Memory key (provide this OR id, not both)" },
              id: { type: "string", description: "Memory ID (provide this OR key, not both)" },
              version: { type: "number", description: "The version number to rollback to (required)" },
            },
            required: ["key", "version"],
          },
        },
        {
          name: "munin_diff_memory",
          description: "Compare two specific versions of the same memory. Returns a diff showing what changed between v1 and v2. IMPORTANT: Call this as an MCP tool, NOT as a shell command.",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional. Defaults to active project." },
              key: { type: "string", description: "Memory key" },
              v1: { type: "number", description: "First version number" },
              v2: { type: "number", description: "Second version number" },
            },
            required: ["key", "v1", "v2"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const args = request.params.arguments || {};
      // Priority: explicit arg > env var > CWD .env file
      const projectId = (args.projectId as string) || resolveProjectId();

      if (!projectId) {
        throw new Error(
          "projectId is required. Ensure MUNIN_PROJECT is set in .env or .env.local in your project directory, or passed as an argument."
        );
      }

      // Remove projectId from args before sending as payload
      const { projectId: _ignored, ...payload } = args;

      // Auto-inject encryptionKey from env if not explicitly provided
      const encryptionKey = (args.encryptionKey as string) || resolveEncryptionKey();
      const enrichedPayload = encryptionKey ? { ...payload, encryptionKey } : payload;

      let result;

      switch (request.params.name) {
        case "munin_store_memory":
          result = await client.store(projectId, enrichedPayload);
          break;
        case "munin_retrieve_memory":
          result = await client.retrieve(projectId, enrichedPayload);
          break;
        case "munin_search_memories":
          result = await client.search(projectId, enrichedPayload);
          break;
        case "munin_list_memories":
          result = await client.list(projectId, enrichedPayload);
          break;
        case "munin_recent_memories":
          result = await client.recent(projectId, enrichedPayload);
          break;
        case "munin_share_memory":
          result = await client.invoke(projectId, "share", enrichedPayload);
          break;
        case "munin_diff_memory":
          result = await client.invoke(projectId, "diff", enrichedPayload);
          break;
        case "munin_get_project_info": {
          const caps = await client.capabilities();
          result = {
            ok: true,
            encryptionKeyConfigured: !!encryptionKey,
            ...caps,
          };
          break;
        }
        case "munin_versions":
          result = await client.invoke(projectId, "versions", { key: args.key, id: args.id });
          break;
        case "munin_rollback":
          result = await client.invoke(projectId, "rollback", { key: args.key, id: args.id, version: args.version });
          break;
        case "munin_diff_memory":
          result = await client.invoke(projectId, "diff", { key: args.key, v1: args.v1, v2: args.v2 });
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