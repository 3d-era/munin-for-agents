# Hướng dẫn sử dụng MCP API (ContextKeep)

Tài liệu này hướng dẫn endpoint `POST /api/mcp` với bộ action rút gọn mới.

## Thông tin chung

- **Endpoint:** `POST /api/mcp`
- **Content-Type:** `application/json`
- **Auth:** bắt buộc có `apiKey` và `projectId`

## Payload chuẩn

```json
{
  "apiKey": "YOUR_API_KEY",
  "projectId": "YOUR_PROJECT_ID",
  "action": "store",
  "payload": {}
}
```

## Action mới (ngắn gọn)

### 1) `store`
Tạo mới hoặc cập nhật memory theo `key`.

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

Ghi chú:
- `ttlSeconds > 0` sẽ set expiry theo TTL.
- Nếu có cả `ttlSeconds` và `expiresAt`, ưu tiên `ttlSeconds`.

---

### 2) `retrieve`
Lấy chi tiết 1 memory theo `key`.

Payload:

```json
{ "key": "unique_key" }
```

---

### 3) `search`
Tìm kiếm hybrid (keyword + semantic), hỗ trợ lọc tag.

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
Lấy 10 memories cập nhật gần nhất.

Payload:

```json
{}
```

---

### 5) `list`
Lấy toàn bộ memories trong project.

Payload:

```json
{}
```

---

### 6) `share`
Share 1 hoặc nhiều memories sang project khác.

Payload:

```json
{
  "memoryIds": ["mem_1", "mem_2"],
  "targetProjectIds": ["proj_a", "proj_b"]
}
```

---

### 7) `versions`
Lấy lịch sử version của memory.

Payload:

```json
{ "id": "mem_1" }
```

hoặc

```json
{ "key": "unique_key" }
```

---

### 8) `rollback`
Rollback memory về version cụ thể.

Payload:

```json
{ "id": "mem_1", "version": 2 }
```

hoặc

```json
{ "key": "unique_key", "version": 2 }
```

---

### 9) `encrypt`
Mã hóa content bằng AES-256-GCM (PBKDF2 SHA-256).

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
Giải mã content từ `cipherText` + `encryptionMeta`.

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

## Alias cũ vẫn dùng được

Các tên cũ vẫn được hỗ trợ để tương thích ngược:

- `store_memory` -> `store`
- `retrieve_memory` -> `retrieve`
- `search_memories` -> `search`
- `list_recent_memories` -> `recent`
- `list_all_memories` -> `list`

## Error format

```json
{
  "error": "Error message"
}
```

Các mã thường gặp:
- `401`: thiếu/sai `apiKey`
- `400`: thiếu tham số bắt buộc hoặc action sai
- `403`: project không thuộc user
- `404`: không tìm thấy memory/version
- `500`: lỗi server
