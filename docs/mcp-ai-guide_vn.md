# 🤖 Hướng dẫn MCP Protocol của Munin cho AI Agents

> **Ngữ cảnh:** Munin cung cấp long-term memory cho AI agents thông qua API tương thích Model Context Protocol (MCP). Tài liệu này hướng dẫn cách tích hợp công cụ nội bộ của pa với Munin.

---

## 🛠 Thông số tích hợp

- **API Endpoint:** `POST /api/mcp`
- **Auth:** Header `x-api-key: <API_KEY>`
- **Content-Type:** `application/json`

## 🧠 Các action cốt lõi

API dùng format payload chuẩn: `{ "action": "string", "payload": { ... } }`.

### 1. `store` (Lưu memory)
Lưu insight hoặc context quan trọng. Nên luôn dùng tag cụ thể để đảm bảo cách ly dữ liệu.

```json
{
  "action": "store",
  "payload": {
    "key": "unique-slug",
    "title": "Tóm tắt ngắn",
    "content": "Nội dung memory chi tiết...",
    "tags": ""
  }
}
```

### 2. `retrieve` (Lấy theo key)
Lấy chính xác nội dung memory khi đã biết key.

```json
{
  "action": "retrieve",
  "payload": { "key": "unique-slug" }
}
```

### 3. `search` (Tìm semantic / keyword)
Tìm memory liên quan bằng truy vấn văn bản.

```json
{
  "action": "search",
  "payload": {
    "query": "How to deploy to AWS?",
    "topK": 5,
    "tags": ["optional-filter"],
    "tagMode": "or"
  }
}
```

### 4. `list` (Liệt kê toàn bộ memories)
Quét danh mục key và title đã lưu.

```json
{
  "action": "list",
  "payload": {}
}
```

### 5. `recent` (Lấy memory mới nhất)
Lấy 10 memory được cập nhật gần nhất.

```json
{
  "action": "recent",
  "payload": {}
}
```

## 🔒 Tính năng bảo mật (E2EE)

Munin hỗ trợ **Zero-Knowledge Encryption**. Nếu project bật E2EE, AI Agent phải tự xử lý toàn bộ vòng đời mã hóa cục bộ. Server sẽ không thấy plaintext.

- **Encryption Key:** AI Agent phải lưu `encryptionKey` của project ở nơi an toàn (ví dụ `.env`). **KHÔNG** gửi key này lên server trong các thao tác chuẩn.
- **Standard E2EE:** Agent BẮT BUỘC mã hóa `content` cục bộ trước khi gọi `store`. Khi gọi `retrieve` hoặc `search`, server trả về `content` đã mã hóa. Agent phải tự giải mã cục bộ bằng key đang lưu.
- **Quantum E2EE (Elite):** Agent tạo semantic vector cục bộ từ plaintext, sau đó mới mã hóa nội dung. Payload BẮT BUỘC có cả `embedding` vector và `encryptionMeta`.

### 🔑 Mã hóa & giải mã cục bộ (Zero-Knowledge)
Khi lấy memory có `encryptionMeta.enabled = true`, `content` sẽ là ciphertext dạng Base64.

**Lưu ý quan trọng về tương thích WebCrypto:**
Web client của Munin dùng chuẩn `WebCrypto API` (AES-GCM), trong đó **auth tag 16-byte được nối vào cuối ciphertext** và `encryptionMeta.authTag` để trống (`""`). Khi giải mã bằng Node.js, Python, hoặc môi trường khác, pa phải tách auth tag từ cuối buffer ciphertext trước khi giải mã.

**Tham số giải mã:**
- Thuật toán: `aes-256-gcm`
- Dẫn xuất key: `PBKDF2` (100,000 iterations, SHA-256, 32 bytes) với `encryptionKey` cục bộ và `encryptionMeta.salt` được cung cấp.
- `iv`: giải mã Base64 từ `encryptionMeta.iv`
- `authTag`: 16 byte cuối của `content` sau khi decode Base64
- `actualCipherText`: phần byte còn lại của `content` sau khi bỏ authTag

**Ví dụ (Python):**

```python
import base64, hashlib
from cryptography.hazmap.primitives.ciphers.aead import AESGCM

# 1. Decode values
salt = base64.b64decode(encryptionMeta["salt"])
iv = base64.b64decode(encryptionMeta["iv"])
full_ciphertext = base64.b64decode(memory["content"])

# 2. Derive key (PBKDF2)
derived_key = hashlib.pbkdf2_hmac('sha256', key.encode(), salt, 100000, dklen=32)

# 3. Decrypt (AESGCM handles the appended 16-byte auth tag automatically in cryptography library)
aesgcm = AESGCM(derived_key)
plaintext = aesgcm.decrypt(iv, full_ciphertext, None)
print(plaintext.decode('utf-8'))
```

**Ví dụ (Node.js):**

```javascript
const crypto = require('crypto');

const salt = Buffer.from(encryptionMeta.salt, 'base64');
const iv = Buffer.from(encryptionMeta.iv, 'base64');
const fullCiphertext = Buffer.from(memory.content, 'base64');

// Split the appended 16-byte AuthTag
const authTag = fullCiphertext.subarray(fullCiphertext.length - 16);
const actualCiphertext = fullCiphertext.subarray(0, fullCiphertext.length - 16);

const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
decipher.setAuthTag(authTag);

const plaintext = Buffer.concat([
    decipher.update(actualCiphertext),
    decipher.final()
]).toString('utf8');
```

### E2EE Helper Actions (chỉ dùng fallback):
Nếu môi trường của pa chưa thể tự mã hóa/giải mã cục bộ, có thể dùng helper phía server (⚠️ **Cảnh báo:** cách này phá vỡ zero-knowledge thuần vì key được gửi lên server):
- `encrypt`: gửi plaintext `content` + `encryptionKey` -> nhận `cipherText` + `encryptionMeta`.
- `decrypt`: gửi `cipherText` + `encryptionKey` + `encryptionMeta` -> nhận lại plaintext `content`.

## 🐢 AI Behavior Protocol

- **Đầu session:** Luôn gọi `list` để nắm context project hiện có.
- **Tại các decision point:** Gọi `store` để lưu quyết định kiến trúc quan trọng.
- **Cuối task:** Dùng logic `/compact` (nội bộ) để tóm tắt công việc thành một memory block mới.

---
*Powered by Munin — Chậm mà chắc như rùa.*
