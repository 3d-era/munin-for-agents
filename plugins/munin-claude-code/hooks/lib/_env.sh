# Munin hook helpers — sourced by session-start, stop, post-compact, error-catalog.
# Portable across bash 3.2+ (macOS default ships bash 3.2).

# Read VAR=value from a dotenv file.
#   - Tolerates missing file or missing key (returns empty, never errors).
#   - Trims outer whitespace, then strips a single matched outer quote pair
#     (preserves whitespace inside quotes, e.g. KEY="  hello  ").
#   - Preserves embedded "=" so base64 padding and JWTs are not truncated.
# Usage: val=$(read_env_var "$file" "VAR_NAME")
read_env_var() {
  local file="$1" var="$2" line val
  [[ -f "$file" ]] || return 0
  line=$(grep -E "^${var}=" "$file" 2>/dev/null | head -n1) || true
  [[ -z "$line" ]] && return 0
  val="${line#${var}=}"
  # Trim leading whitespace (bash 3.2 compatible)
  val="${val#"${val%%[![:space:]]*}"}"
  # Trim trailing whitespace
  val="${val%"${val##*[![:space:]]}"}"
  # Strip matched outer quote pair (single OR double, not mixed)
  case "$val" in
    '"'*'"') val="${val#\"}"; val="${val%\"}" ;;
    "'"*"'") val="${val#\'}"; val="${val%\'}" ;;
  esac
  printf '%s' "$val"
}

# Escape a string for embedding in a JSON string literal.
# Delegates to node so all control chars, quotes, and backslashes are handled
# correctly — bash parameter expansion can't reliably escape backslashes.
# Returns the escaped string (no surrounding quotes). If node is unavailable
# the function returns EMPTY rather than the raw value: an empty JSON literal
# is always valid, whereas an unescaped value containing `"` or `\` would
# break the consumer's JSON parser. The rest of the hook already requires
# node (npx), so this only triggers when the broader hook is non-functional.
# Usage: printf '"%s"' "$(json_escape "$raw")"
json_escape() {
  node -e 'process.stdout.write(JSON.stringify(process.argv[1] || "").slice(1, -1))' "$1" 2>/dev/null \
    || true
}
