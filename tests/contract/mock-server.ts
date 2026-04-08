import { createServer } from "node:http";

const MAX_BODY_BYTES = 1e6; // 1 MB

const host = process.env.MUNIN_CONTRACT_HOST ?? "127.0.0.1";
const port = Number(process.env.MUNIN_CONTRACT_PORT ?? 4010);

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/mcp/capabilities") {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        data: {
          specVersion: "v1.0.0",
          actions: {
            core: ["store", "retrieve", "search", "list", "recent"],
            optional: ["share", "versions", "rollback", "encrypt", "decrypt"],
          },
          features: {
            semanticSearch: { supported: true },
            encryption: { supported: true },
          },
          metadata: {
            serverVersion: "mock-1.0.0",
            timestamp: new Date().toISOString(),
          },
        },
      }),
    );
    return;
  }

  if (req.method === "POST" && req.url === "/api/mcp/action") {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > MAX_BODY_BYTES) {
        req.destroy();
      }
    });
    req.on("end", () => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } }));
        return;
      }
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          ok: true,
          data: {
            action: parsed.action,
            project: parsed.project,
            payload: parsed.payload,
            source: "mock-server",
          },
        }),
      );
    });
    req.on("error", () => {
      /* connection closed */
    });
    return;
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: false, error: { code: "NOT_FOUND", message: "Not found" } }));
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use on ${host}. ` +
        "Use MUNIN_CONTRACT_PORT to pick another port.",
    );
    process.exit(1);
  }

  throw error;
});

server.listen(port, host, () => {
  console.log(`Munin contract mock server listening on http://${host}:${port}`);
});
