# MCP API Guide (ContextKeep)

This document explains the `POST /api/mcp` endpoint using the new simplified action set.

## General Information

- **Endpoint:** `POST /api/mcp`
- **Content-Type:** `application/json`
- **Auth:** `apiKey` and `projectId` (Context Core ID) are required

## Standard Payload

```json
{
  "apiKey": "YOUR_API_KEY",
  "projectId": "YOUR_CONTEXT_CORE_ID",
  "action": "store",
  "payload": {}
}
```

## New Actions (Simplified)

### 1) `store`
Create or update a memory by `key`.

Payload:

```json
{
  "key": "unique_key",
  "title": "Optional title",
  "content": "Memory content",
  "tags": ["tag1", "tag2"],
  "ttlSeconds": 86400,
  "expiresAt": "2026-12-31T00:00:00.000Z",
  "encryptionMeta": {
    "enabled": true,
    "algorithm": "aes-256-gcm",
    "iv": "...",
    "salt": "...",
    "authTag": "..."
  }
}
```

Notes:
- `ttlSeconds > 0` sets expiry using TTL.
- If both `ttlSeconds` and `expiresAt` are provided, `ttlSeconds` takes priority.
- If `E2EE with GraphRAG` is enabled, you MUST provide an `embedding` array in the payload root (next to `action`).
- **GraphRAG**: Automatic entity/relationship extraction is performed on `store` if the project is not E2EE.

---

### 2) `retrieve`
Get details for a single memory by `key`.

Payload:

```json
{ "key": "unique_key" }
```

---

### 3) `search`
Run hybrid search (keyword + semantic), with optional tag filtering. 
Returns memories, knowledge graph (entities/relationships), and Context Core metadata.

Payload:

```json
{
  "query": "onboarding flow",
  "tags": ["product", "ux"],
  "tagMode": "and",
  "topK": 20
}
```

`tagMode`: `and` | `or`.

---

### 4) `recent`
Get the 10 most recently updated memories.

Payload:

```json
{}
```

---

### 5) `list`
Get all memories in the current context core.

Payload:

```json
{}
```

---

### 6) `share`
Share one or more memories to other context cores.

Payload:

```json
{
  "memoryIds": ["mem_1", "mem_2"],
  "targetProjectIds": ["core_a", "core_b"]
}
```

---

### 7) `versions`
Get version history for a memory.

Payload:

```json
{ "id": "mem_1" }
```

or

```json
{ "key": "unique_key" }
```

---

### 8) `rollback`
Rollback a memory to a specific version.

Payload:

```json
{ "id": "mem_1", "version": 2 }
```

or

```json
{ "key": "unique_key", "version": 2 }
```

---

### 9) `encrypt`
Encrypt content using AES-256-GCM (PBKDF2 SHA-256).

Payload:

```json
{
  "content": "secret text",
  "key": "user-secret-key"
}
```

Response:

```json
{
  "success": true,
  "action": "encrypt",
  "data": {
    "cipherText": "...base64...",
    "encryptionMeta": {
      "enabled": true,
      "algorithm": "aes-256-gcm",
      "iv": "...base64...",
      "salt": "...base64...",
      "authTag": "...base64..."
    }
  }
}
```

---

### 10) `decrypt`
Decrypt content from `cipherText` + `encryptionMeta`.

Payload:

```json
{
  "cipherText": "...base64...",
  "key": "user-secret-key",
  "encryptionMeta": {
    "iv": "...base64...",
    "salt": "...base64...",
    "authTag": "...base64..."
  }
}
```

---

## Legacy Aliases Still Supported

Older names are still supported for backward compatibility:

- `store_memory` -> `store`
- `retrieve_memory` -> `retrieve`
- `search_memories` -> `search`
- `list_recent_memories` -> `recent`
- `list_all_memories` -> `list`

## Error Format

```json
{
  "error": "Error message"
}
```

Common status codes:
- `401`: missing/invalid `apiKey`
- `400`: missing required parameters or invalid action
- `403`: project does not belong to the user
- `404`: memory/version not found
- `500`: server error
