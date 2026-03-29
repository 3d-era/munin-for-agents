# Quickstart: OpenClaw (5 phút)

## 1) Chuẩn bị env

```bash
export MUNIN_BASE_URL="https://munin.kalera.dev" # Hoặc http://localhost:3237 nếu chạy local
export MUNIN_PROJECT="id-context-core-cua-pa"
export MUNIN_API_KEY="key-lay-tu-dashboard"
export MUNIN_TIMEOUT_MS="15000"
export MUNIN_RETRIES="3"
export MUNIN_BACKOFF_MS="300"
```

## 2) Build adapter

```bash
pnpm --filter @kalera/munin-openclaw build
```

## 3) Kiểm tra capabilities

```bash
pnpm --filter @kalera/munin-openclaw exec munin-openclaw capabilities
```

## 4) Gọi action mẫu

```bash
pnpm --filter @kalera/munin-openclaw exec munin-openclaw search '{"query":"munin ecosystem"}'
```

## 5) Notes production hardening

- CLI có retry/backoff tự động theo `MUNIN_RETRIES`, `MUNIN_BACKOFF_MS`.
- Timeout request theo `MUNIN_TIMEOUT_MS`.
- Error output đã redact các key nhạy cảm (`token`, `apiKey`, `secret`, `password`).
