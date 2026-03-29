import { MuninClient } from "@kalera/munin-sdk";
import { Type } from "@sinclair/typebox";
import { z } from "zod";

export default {
  id: "munin-memory",
  name: "Munin ContextKeep",
  description: "Persistent memory tools for OpenClaw agents.",
  kind: "memory",
  configSchema: z.object({
    baseUrl: z
      .string()
      .default("https://munin.kalera.dev")
      .describe("The base URL for your Munin ContextKeep server."),
    apiKey: z.string().optional().describe("Your API key for Munin."),
  }) as any,
  register(api: any) {
    const baseUrl =
      (api.pluginConfig?.baseUrl as string) ||
      process.env.MUNIN_BASE_URL ||
      "https://munin.kalera.dev";
    const apiKey =
      (api.pluginConfig?.apiKey as string) || process.env.MUNIN_API_KEY;

    if (!apiKey) {
      api.logger.warn(
        "Munin API key is missing. ContextKeep tools will not be registered.",
      );
      return;
    }

    const client = new MuninClient({ baseUrl, apiKey });

    api.registerTool({
      name: "munin_store_memory",
      label: "Store Munin Memory",
      description: "Store a new memory or update an existing one in ContextKeep.",
      parameters: Type.Object({
        projectId: Type.String({
          description: "The Context Core ID for isolation.",
        }),
        key: Type.String({ description: "Unique identifier for the memory." }),
        content: Type.String({ description: "The content of the memory." }),
        tags: Type.Optional(
          Type.String({ description: "Comma-separated list of tags." }),
        ),
        title: Type.Optional(
          Type.String({ description: "Human-readable title." }),
        ),
      }),
      async execute(_toolCallId: string, params: any) {
        const { projectId, ...payload } = params;
        const res = await client.invoke(projectId, "store", payload);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(res.data, null, 2),
            },
          ],
          details: res.data,
        };
      },
    });

    api.registerTool({
      name: "munin_retrieve_memory",
      label: "Retrieve Munin Memory",
      description: "Retrieve a memory by its key from ContextKeep.",
      parameters: Type.Object({
        projectId: Type.String({ description: "The Context Core ID." }),
        key: Type.String({
          description: "The unique identifier of the memory.",
        }),
      }),
      async execute(_toolCallId: string, params: any) {
        const { projectId, key } = params;
        const res = await client.invoke(projectId, "retrieve", { key });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(res.data, null, 2),
            },
          ],
          details: res.data,
        };
      },
    });

    api.registerTool({
      name: "munin_search_memories",
      label: "Search Munin Memories",
      description: "Search for memories by key, title, or content in ContextKeep.",
      parameters: Type.Object({
        projectId: Type.String({ description: "The Context Core ID." }),
        query: Type.String({ description: "The search term." }),
      }),
      async execute(_toolCallId: string, params: any) {
        const { projectId, query } = params;
        const res = await client.invoke(projectId, "search", { query });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(res.data, null, 2),
            },
          ],
          details: res.data,
        };
      },
    });
  },
};
