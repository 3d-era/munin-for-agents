# Generic MCP Adapter Template

Use this template to bootstrap adapters for Kilo Code, Qwen Code, OpenClaw, Google Antigravity, and other MCP-compatible clients.

## What is included

- `template/package.json`
- `template/tsconfig.json`
- `template/src/index.ts`
- Shared usage pattern based on `munin/sdk`

## Steps

1. Copy `template` directory to `adapters/<new-adapter-name>`
2. Update package name and README
3. Adapt dispatch API (`execute`, `callTool`, etc.)
4. Add adapter manifest for contract test
5. Verify with `pnpm test:contract`
