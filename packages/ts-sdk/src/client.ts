import { MuninSdkError, MuninTransportError } from "./errors.js";
import {
  fetchCapabilities,
  isActionSupported,
} from "./capabilities.js";
import type {
  MuninAction,
  MuninActionEnvelope,
  MuninCapabilities,
  MuninClientConfig,
  MuninResponse,
} from "./types.js";

const DEFAULT_TIMEOUT_MS = 15_000;

export class MuninClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private capabilitiesCache?: MuninCapabilities;

  constructor(config?: MuninClientConfig) {
    this.baseUrl = (config?.baseUrl || "https://munin.kalera.dev").replace(/\/$/, "");
    this.apiKey = config?.apiKey;
    this.timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = config?.fetchImpl ?? fetch;
  }

  async capabilities(forceRefresh = false): Promise<MuninCapabilities> {
    if (this.capabilitiesCache && !forceRefresh) {
      return this.capabilitiesCache;
    }

    const caps = await fetchCapabilities(
      this.baseUrl,
      this.apiKey,
      this.fetchImpl,
    );
    this.capabilitiesCache = caps;
    return caps;
  }

  async invoke<TPayload extends Record<string, unknown>, TData = unknown>(
    projectId: string,
    action: MuninAction,
    payload: TPayload,
    options?: { requestId?: string; ensureCapability?: boolean },
  ): Promise<MuninResponse<TData>> {
    if (options?.ensureCapability) {
      const caps = await this.capabilities();
      if (!isActionSupported(caps, action)) {
        throw new MuninSdkError({
          code: "FEATURE_DISABLED",
          message: `Action '${action}' is not supported by current server capabilities`,
        });
      }
    }

    const request = {
      apiKey: this.apiKey,
      project: projectId,
      projectId: projectId, // Fallback for un-restarted server
      action,
      payload,
      requestId: options?.requestId,
      client: {
        name: "@kalera/munin-sdk",
        version: "1.0.0",
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const response = await this.fetchImpl(`${this.baseUrl}/api/mcp/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    }).catch((error: unknown) => {
      throw new MuninTransportError(
        `Request failed for action '${action}': ${String(error)}`,
      );
    });

    clearTimeout(timeout);

    const body = (await response.json()) as any;

    if (!response.ok || (body.ok === false) || (body.success === false)) {
      let errObj = body.error;
      if (typeof errObj === 'string') {
        errObj = { code: "INTERNAL_ERROR", message: errObj };
      }
      
      throw new MuninSdkError(
        errObj ?? {
          code: "INTERNAL_ERROR",
          message: `Unexpected failure invoking action '${action}'`,
        },
      );
    }

    return this.formatLlmResponse(body);
  }

  /**
   * Cleans up raw Munin response for LLM context efficiency.
   * Removes dense vector arrays and formats GraphRAG objects into readable structures.
   */
  private formatLlmResponse(rawRes: any): any {
    if (!rawRes || !rawRes.data) return rawRes;

    const data = rawRes.data;

    // Clean single memory retrieve
    if (data.key && data.content) {
      if (data.embedding) delete data.embedding;
      if (data.knowledge_graph) {
        data.knowledge_graph = this.formatGraph(data.knowledge_graph);
      }
    }

    // Clean search/list/recent results
    if (Array.isArray(data.results)) {
      data.results = data.results.map((mem: any) => {
        if (mem.embedding) delete mem.embedding;
        return mem;
      });
    }
    
    // Server 'search' action returns 'memories' instead of 'results'
    if (Array.isArray(data.memories)) {
      data.memories = data.memories.map((mem: any) => {
        if (mem.embedding) delete mem.embedding;
        return mem;
      });
    }

    // Clean graph in search
    if (data.knowledge_graph) {
      data.knowledge_graph = this.formatGraph(data.knowledge_graph);
    }

    return rawRes;
  }

  private formatGraph(kg: any): any {
    if (!kg) return kg;
    
    const entities = (kg.entities || []).map((e: any) => {
      if (e.embedding) delete e.embedding;
      return `${e.label || 'Unknown'} (${e.type || 'Unknown'}): ${e.description || ''}`;
    });

    // To make relationships readable without doing a separate map lookup, 
    // we use the sourceEntityId and targetEntityId directly or map if populated.
    const relationships = (kg.relationships || []).map((r: any) => {
      if (r.embedding) delete r.embedding;
      const source = r.sourceLabel || r.sourceEntityId || 'Unknown';
      const target = r.targetLabel || r.targetEntityId || 'Unknown';
      return `${source} -[${r.type || 'Unknown'}]-> ${target}`;
    });

    return {
      summary: "GraphRAG knowledge formatted for readability",
      entities,
      relationships
    };
  }

  async store(projectId: string, payload: Record<string, unknown>) {
    return this.invoke(projectId, "store", payload, { ensureCapability: true });
  }

  async retrieve(projectId: string, payload: Record<string, unknown>) {
    return this.invoke(projectId, "retrieve", payload, { ensureCapability: true });
  }

  async search(projectId: string, payload: Record<string, unknown>) {
    return this.invoke(projectId, "search", payload, { ensureCapability: true });
  }

  async list(projectId: string, payload: Record<string, unknown> = {}) {
    return this.invoke(projectId, "list", payload, { ensureCapability: true });
  }

  async recent(projectId: string, payload: Record<string, unknown> = {}) {
    return this.invoke(projectId, "recent", payload, { ensureCapability: true });
  }
}
