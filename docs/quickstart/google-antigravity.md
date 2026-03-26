# Quickstart: Google Antigravity (5 phút)

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
pnpm --filter @kalera/munin-antigravity build
```

## 3) Lấy capabilities

```bash
pnpm --filter @kalera/munin-antigravity exec munin-antigravity capabilities
```

## 4) Gọi action mẫu

```bash
pnpm --filter @kalera/munin-antigravity exec munin-antigravity list '{"limit":10}'
```

## 5) Notes production hardening

- CLI hỗ trợ retry + exponential backoff + jitter.
- Timeout configurable qua `MUNIN_TIMEOUT_MS`.
- Log lỗi đã sanitize thông tin nhạy cảm.
