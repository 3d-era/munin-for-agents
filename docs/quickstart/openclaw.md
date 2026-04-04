# Quickstart: OpenClaw (5 phút)

## 1) Cài plugin Munin

```bash
openclaw plugins install @kalera/munin-openclaw
```

Sau khi cài, OpenClaw sẽ tự động nhận diện plugin và expose các `munin_*` tools cho agent.

## 2) Chuẩn bị env

```bash
export MUNIN_PROJECT="id-context-core-cua-pa"
export MUNIN_API_KEY="key-lay-tu-dashboard"
export MUNIN_TIMEOUT_MS="15000"
export MUNIN_RETRIES="3"
export MUNIN_BACKOFF_MS="300"
```

## 3) Build adapter (tuỳ chọn — chỉ cần nếu muốn dev local)

```bash
pnpm --filter @kalera/munin-openclaw build
```

## 4) Kiểm tra capabilities

```bash
pnpm --filter @kalera/munin-openclaw exec munin-openclaw capabilities
```

## 5) Gọi action mẫu

```bash
pnpm --filter @kalera/munin-openclaw exec munin-openclaw search '{"query":"munin ecosystem"}'
```

## 6) Notes production hardening

- CLI có retry/backoff tự động theo `MUNIN_RETRIES`, `MUNIN_BACKOFF_MS`.
- Timeout request theo `MUNIN_TIMEOUT_MS`.
- Error output đã redact các key nhạy cảm (`token`, `apiKey`, `secret`, `password`).
