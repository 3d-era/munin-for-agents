import { MuninClient } from "@kalera/munin-sdk";
import { Type } from "@sinclair/typebox";
import { z } from "zod";

export default {
  id: "munin-openclaw",
  name: "Munin",
  description: "Persistent memory tools for OpenClaw agents.",
  kind: "memory",
  configSchema: z.object({
    baseUrl: z
      .string()
      .default("https://munin.kalera.dev")
      .describe("The base URL for your Munin server."),
    apiKey: z.string().optional().describe("Your API key for Munin."),
    projectId: z.string().optional().describe("Your Context Core ID (e.g. proj_xxx)."),
  }) as any,
  register(api: any) {
    const baseUrl =
      (api.pluginConfig?.baseUrl as string) ||
      process.env.MUNIN_BASE_URL ||
      "https://munin.kalera.dev";
    const apiKey =
      (api.pluginConfig?.apiKey as string) || process.env.MUNIN_API_KEY;
    const projectId =
      (api.pluginConfig?.projectId as string) || process.env.MUNIN_PROJECT;
    const encryptionKey =
      process.env.MUNIN_ENCRYPTION_KEY;

    if (!apiKey || !projectId) {
      api.logger.warn(
        "Munin apiKey or projectId is missing. Munin tools will not be registered.",
      );
      return;
    }

    const client = new MuninClient({ baseUrl, apiKey });

    // Helper: inject encryptionKey if set
    const enrichPayload = (payload: any) =>
      encryptionKey ? { ...payload, encryptionKey } : payload;

    const handleResult = (res: any) => ({
      content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }],
      details: res.data,
    });

    api.registerTool({
      name: "munin_store_memory",
      label: "Store Munin Memory",
      description: "Store a new memory or update an existing one in Munin.",
      parameters: Type.Object({
        key: Type.String({ description: "Unique identifier for the memory." }),
        content: Type.String({ description: "The content of the memory." }),
        tags: Type.Optional(Type.String({ description: "Comma-separated list of tags." })),
        title: Type.Optional(Type.String({ description: "Human-readable title." })),
      }),
      async execute(_toolCallId: string, payload: any) {
        const res = await client.invoke(projectId, "store", enrichPayload(payload));
        return handleResult(res);
      },
    });

    api.registerTool({
      name: "munin_retrieve_memory",
      label: "Retrieve Munin Memory",
      description: "Retrieve a memory by its key from Munin.",
      parameters: Type.Object({
        key: Type.String({ description: "The unique identifier of the memory." }),
      }),
      async execute(_toolCallId: string, params: any) {
        const { key } = params;
        const res = await client.invoke(projectId, "retrieve", enrichPayload({ key }));
        return handleResult(res);
      },
    });

    api.registerTool({
      name: "munin_search_memories",
      label: "Search Munin Memories",
      description: "Search for memories by key, title, or content in Munin.",
      parameters: Type.Object({
        query: Type.String({ description: "The search term." }),
      }),
      async execute(_toolCallId: string, params: any) {
        const { query } = params;
        const res = await client.invoke(projectId, "search", enrichPayload({ query }));
        return handleResult(res);
      },
    });

    api.registerTool({
      name: "munin_list_memories",
      label: "List Munin Memories",
      description: "List all memories with pagination support.",
      parameters: Type.Object({
        limit: Type.Optional(Type.Number({ description: "Max results (default: 10)." })),
        offset: Type.Optional(Type.Number({ description: "Pagination offset (default: 0)." })),
      }),
      async execute(_toolCallId: string, params: any) {
        const res = await client.invoke(projectId, "list", enrichPayload(params));
        return handleResult(res);
      },
    });

    api.registerTool({
      name: "munin_recent_memories",
      label: "Recent Munin Memories",
      description: "Get the most recently updated memories.",
      parameters: Type.Object({
        limit: Type.Optional(Type.Number({ description: "Max results (default: 10)." })),
      }),
      async execute(_toolCallId: string, params: any) {
        const res = await client.invoke(projectId, "recent", enrichPayload(params));
        return handleResult(res);
      },
    });

    api.registerTool({
      name: "munin_share_memory",
      label: "Share Munin Memories",
      description: "Share one or more memories to other projects. Requires Pro/Elite tier. Target project must share the same Hash Key for encrypted content.",
      parameters: Type.Object({
        memoryIds: Type.Array(Type.String(), { description: "Array of memory IDs to share." }),
        targetProjectIds: Type.Array(Type.String(), { description: "Array of target project IDs." }),
      }),
      async execute(_toolCallId: string, params: any) {
        const { memoryIds, targetProjectIds } = params;
        const res = await client.invoke(projectId, "share", enrichPayload({ memoryIds, targetProjectIds }));
        return handleResult(res);
      },
    });
  },
};
