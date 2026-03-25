# Quickstart: OpenClaw (5 phút)

## 1) Chuẩn bị env

```bash
export MUNIN_BASE_URL="http://127.0.0.1:4010"
export MUNIN_PROJECT="default"
export MUNIN_API_KEY=""
export MUNIN_TIMEOUT_MS="15000"
export MUNIN_RETRIES="3"
export MUNIN_BACKOFF_MS="300"
```

## 2) Build adapter

```bash
pnpm --filter munin/openclaw build
```

## 3) Kiểm tra capabilities

```bash
pnpm --filter munin/openclaw exec munin-openclaw capabilities
```

## 4) Gọi action mẫu

```bash
pnpm --filter munin/openclaw exec munin-openclaw search '{"query":"munin ecosystem"}'
```

## 5) Notes production hardening

- CLI có retry/backoff tự động theo `MUNIN_RETRIES`, `MUNIN_BACKOFF_MS`.
- Timeout request theo `MUNIN_TIMEOUT_MS`.
- Error output đã redact các key nhạy cảm (`token`, `apiKey`, `secret`, `password`).
