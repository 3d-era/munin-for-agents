# @kalera/munin-shared-version

Single source of truth for version strings across the Munin ecosystem. All packages import version from here instead of hardcoding it.

## Usage

```typescript
import { VERSION, SERVER_VERSION } from "@kalera/munin-shared-version";

console.log(VERSION);        // e.g. "1.3.0"
console.log(SERVER_VERSION); // same as VERSION
```

## Version Bump

Update all ecosystem packages at once via the bump script:

```bash
node scripts/bump-version.ts <new-version>
```

This updates:
- `shared-version/src/index.ts`
- All hardcoded version strings in source files
- All `package.json` version fields across the ecosystem
