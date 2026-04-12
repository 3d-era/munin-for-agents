# @kalera/munin-spec

Munin protocol specification and JSON schemas. This is a private package — it defines the contract between SDK clients and the Munin MCP server.

## Schemas

| Schema | Description |
|--------|-------------|
| `McpAction` | Valid MCP action names (`store`, `retrieve`, `search`, `list`, `recent`, `share`) |
| `MuninRequest` | Request envelope sent to the MCP server |
| `MuninResponse` | Response envelope with `ok`, `data`, `error` fields |

## For SDK Authors

Import schemas from this package to type your SDK against the official protocol. Breaking changes to this spec will result in a major version bump.
