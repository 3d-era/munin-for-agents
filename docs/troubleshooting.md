# Troubleshooting

## 401/403 errors
- Verify `MUNIN_API_KEY` and token scope.
- Ensure current project/tier has action enabled.

## Action unsupported
- Check `capabilities` response.
- Ensure fallback for optional actions.

## Contract tests failing
- Confirm Munin server is running at `MUNIN_API_KEY`.
- Update adapter manifest if endpoint or project changed.

## Timeout errors
- Increase `MUNIN_TIMEOUT_MS`.
- Check network reachability and server logs.
