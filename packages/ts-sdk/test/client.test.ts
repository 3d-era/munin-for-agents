import assert from "node:assert/strict";
import { MuninClient } from "../src/client";

async function run() {
  const fakeFetch: typeof fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith("/api/mcp/capabilities")) {
      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            specVersion: "v1.0.0",
            actions: {
              core: ["store", "retrieve", "search", "list", "recent"],
              optional: ["share"],
            },
            features: {
              encryption: { supported: true },
            },
            metadata: {
              serverVersion: "0.0.1",
              timestamp: new Date().toISOString(),
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (url.endsWith("/api/mcp/action") && init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            echoedAction: body.action,
            echoedProject: body.project,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: false }), { status: 404 });
  }) as typeof fetch;

  const client = new MuninClient({
    baseUrl: "http://localhost:4000",
    project: "default",
    fetchImpl: fakeFetch,
  });

  const capabilities = await client.capabilities();
  assert.equal(capabilities.specVersion, "v1.0.0");

  const result = await client.store({ key: "hello", content: "world" });
  assert.equal(result.ok, true);
  assert.equal((result.data as any).echoedAction, "store");

  console.log("sdk-ts tests passed");
}

void run();
