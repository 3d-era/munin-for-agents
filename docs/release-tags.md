# Release Tag Mapping

Per-package release tags follow this convention:

- `spec-vX.Y.Z` -> `packages/spec`
- `munin-sdk-vX.Y.Z` -> `packages/ts-sdk`
- `sdk-py-vX.Y.Z` -> `packages/python-sdk`
- `munin-cursor-vX.Y.Z` -> `adapters/cursor`
- `munin-claude-vX.Y.Z` -> `adapters/claude`
- `munin-gemini-vX.Y.Z` -> `adapters/gemini`
- `munin-openclaw-vX.Y.Z` -> `adapters/openclaw`
- `munin-antigravity-vX.Y.Z` -> `adapters/antigravity`
- `munin-kilo-vX.Y.Z` -> `adapters/kilo`
- `munin-qwen-vX.Y.Z` -> `adapters/qwen`

## Examples

- `munin-openclaw-v0.2.0`
- `munin-sdk-v0.3.1`
- `munin-antigravity-v1.0.0`

## Validation rule

Only tags matching one of the prefixes above should trigger package-specific release jobs.
