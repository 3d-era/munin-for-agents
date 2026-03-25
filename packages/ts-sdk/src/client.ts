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
  private readonly project: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private capabilitiesCache?: MuninCapabilities;

  constructor(config: MuninClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.project = config.project;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = config.fetchImpl ?? fetch;
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

    const request: MuninActionEnvelope<TPayload> = {
      action,
      project: this.project,
      payload,
      requestId: options?.requestId,
      client: {
        name: "munin/sdk/dist/index.js",
        version: "0.1.0",
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const response = await this.fetchImpl(`${this.baseUrl}/api/mcp/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    }).catch((error: unknown) => {
      throw new MuninTransportError(
        `Request failed for action '${action}': ${String(error)}`,
      );
    });

    clearTimeout(timeout);

    const body = (await response.json()) as MuninResponse<TData>;

    if (!response.ok || !body.ok) {
      throw new MuninSdkError(
        body.error ?? {
          code: "INTERNAL_ERROR",
          message: `Unexpected failure invoking action '${action}'`,
        },
      );
    }

    return body;
  }

  async store(payload: Record<string, unknown>) {
    return this.invoke("store", payload, { ensureCapability: true });
  }

  async retrieve(payload: Record<string, unknown>) {
    return this.invoke("retrieve", payload, { ensureCapability: true });
  }

  async search(payload: Record<string, unknown>) {
    return this.invoke("search", payload, { ensureCapability: true });
  }

  async list(payload: Record<string, unknown> = {}) {
    return this.invoke("list", payload, { ensureCapability: true });
  }

  async recent(payload: Record<string, unknown> = {}) {
    return this.invoke("recent", payload, { ensureCapability: true });
  }
}
