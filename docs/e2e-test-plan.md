# Munin Ecosystem End-to-End Test Plan

## 1. Objective

Validate that Munin ecosystem components work together end-to-end:

- Munin server API compatibility with spec v1
- SDK behavior (`sdk-ts`, `sdk-py`)
- Adapter runtime behavior across target agents
- Contract matrix and release readiness

## 2. Scope

In scope:

- Core actions: `store`, `retrieve`, `search`, `list`, `recent`
- Capability negotiation
- Retry/backoff and timeout behavior in adapter CLIs
- Error normalization and redaction behavior
- Multi-adapter contract matrix

Out of scope (v1):

- Performance/load benchmarking at scale
- Multi-region networking scenarios
- Non-core optional actions stress tests

## 3. Test Environments

## 3.1 Local mock environment

- Start mock server:

```bash
pnpm exec tsx tests/contract/mock-server.ts
```

- Base URL: `http://127.0.0.1:4010`

## 3.2 Local real Munin server

- Run real Munin backend from parent repo
- Configure adapters with:
  - `MUNIN_BASE_URL`
  - `MUNIN_PROJECT`
  - `MUNIN_API_KEY` (if enabled)

## 3.3 CI environment

- GitHub Actions `ci.yml`
- Matrix execution through `pnpm test:contract`

## 4. Test Matrix

Adapters to validate:

- Cursor
- Claude Code
- Gemini CLI
- OpenClaw
- Google Antigravity
- Kilo Code (scaffold smoke)
- Qwen Code (scaffold smoke)

SDKs to validate:

- `@kalera/munin-sdk`
- `munin-sdk-py`

## 5. Test Cases

## 5.1 Capability handshake

1. Call `capabilities` via each adapter CLI.
2. Assert core actions present.
3. Assert `specVersion` format is valid.

## 5.2 Core action flow

1. `store` a memory key.
2. `retrieve` same key.
3. `search` by known keyword/tag.
4. `list` memories with limit.
5. `recent` returns last updated entries.

Expected:

- All actions return `ok: true`
- Payload shape aligns with spec envelopes

## 5.3 Retry/backoff behavior

1. Point adapter to unavailable endpoint.
2. Confirm retries occur.
3. Confirm final error emitted after max retries.

Expected:

- Process exits non-zero
- Error body emitted as JSON
- No secret values leaked

## 5.4 Timeout behavior

1. Set low timeout (`MUNIN_TIMEOUT_MS=100`).
2. Trigger slow endpoint (real server or injected delay).

Expected:

- Timeout failure occurs deterministically
- Error code/message surfaced cleanly

## 5.5 Redaction validation

1. Trigger authentication error containing token-like text.
2. Validate logs replace sensitive values with `[REDACTED]`.

## 5.6 Contract matrix

Run:

```bash
pnpm test:contract
```

Expected:

- All manifests in `tests/contract/adapter-manifests` execute
- Failures identify adapter/action precisely

## 6. Execution Steps

1. `pnpm install`
2. `pnpm lint`
3. `pnpm build`
4. `pnpm test`
5. Start mock server (or real server)
6. `pnpm test:contract`
7. Run manual adapter CLI smoke for each first-class adapter

## 7. Exit Criteria

E2E is considered passing when:

- All workspace lint/build/test pass
- Contract matrix passes against target environment
- First-class adapters complete core action flow
- Redaction/retry/timeout behaviors verified
- No blocking defects remain open

## 8. Defect Triage Policy

- P0: data corruption, auth bypass, secret leak -> block release
- P1: core action failure on first-class adapter -> block release
- P2: long-tail adapter scaffold issue -> can release with known limitation
- P3: docs/cosmetic issues -> fix in follow-up

## 9. Reporting Template

For each test run, capture:

- Environment (mock/real/CI)
- Commit SHA
- Adapter(s) tested
- Passed/failed cases
- Logs/artifacts links
- Release recommendation (GO / NO-GO)
