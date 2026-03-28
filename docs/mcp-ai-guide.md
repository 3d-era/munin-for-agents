# 🤖 Munin MCP Protocol Guide for AI Agents

> **Context:** Munin provides long-term memory for AI agents via a Model Context Protocol (MCP) compatible API. This guide explains how to integrate your internal tools with Munin.

---

## 🛠 Integration Specs

- **API Endpoint:** `POST /api/mcp`
- **Auth:** Header `x-api-key: <API_KEY>`
- **Content-Type:** `application/json`

## 🧠 Core Actions

The API uses a standard payload format: `{ "action": "string", "payload": { ... } }`.

### 1. `store` (Save Memory)
Persist key insights or context. Always use specific tags to maintain isolation.
```json
{
  "action": "store",
  "payload": {
    "key": "unique-slug",
    "title": "Short Summary",
    "content": "Detailed memory body...",
    "tags": ""
  }
}
```

### 2. `retrieve` (Fetch by Key)
Get exact memory content if the key is known.
```json
{
  "action": "retrieve",
  "payload": { "key": "unique-slug" }
}
```

### 3. `search` (Semantic / Keyword Search)
Find relevant memories using text query.
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

### 4. `list` (List All Memories)
Scan the directory of stored keys and titles.
```json
{
  "action": "list",
  "payload": {}
}
```

### 5. `recent` (Get Latest)
Fetch the 10 most recently updated memories.
```json
{
  "action": "recent",
  "payload": {}
}
```

## 🔒 Security Features (E2EE)

Munin supports **Zero-Knowledge Encryption**. If a project has E2EE enabled, AI Agents are responsible for the entire encryption lifecycle locally. The server is blind to your plaintext.

- **Encryption Key:** AI Agents must store the project's `encryptionKey` securely (e.g., in `.env`). **DO NOT** send this key to the server for standard operations.
- **Standard E2EE:** Agents MUST encrypt the `content` locally before calling `store`. When calling `retrieve` or `search`, the server will return the encrypted `content`. The Agent must decrypt this ciphertext locally using its stored key.
- **Quantum E2EE (Elite):** Agents generate semantic vectors locally from plaintext, then encrypt the body. The payload MUST include both the `embedding` vector and the `encryptionMeta`.

### 🔑 Local Encryption & Decryption (Zero-Knowledge)
When you fetch a memory with `encryptionMeta.enabled = true`, the `content` will be a Base64-encoded ciphertext. 

**Important WebCrypto Compatibility Note:**
Munin's web client uses the standard `WebCrypto API` (AES-GCM), which **appends the 16-byte authentication tag to the end of the ciphertext** and leaves `encryptionMeta.authTag` empty (`""`). When decrypting in Node.js, Python, or other environments, you must slice the tag off the end of the ciphertext buffer before decrypting.

**Decryption Parameters:**
- Algorithm: `aes-256-gcm`
- Key derivation: `PBKDF2` (100,000 iterations, SHA-256, 32 bytes) using your local `encryptionKey` and the provided `encryptionMeta.salt`.
- `iv`: Decoded from Base64 `encryptionMeta.iv`
- `authTag`: Last 16 bytes of the decoded `content`
- `actualCipherText`: Remaining bytes of the decoded `content`

**Example (Python):**
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

**Example (Node.js):**
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

### E2EE Helper Actions (Fallback Only):
If you cannot perform local encryption/decryption in your environment, you can use these server-side helpers (⚠️ **Warning:** This breaks pure Zero-Knowledge as the key is transmitted to the server):
- `encrypt`: Send plaintext `content` + `encryptionKey` -> Receive `cipherText` + `encryptionMeta`.
- `decrypt`: Send `cipherText` + `encryptionKey` + `encryptionMeta` -> Receive plaintext `content`.

## 🐢 AI Behavior Protocol
- **Start of Session:** Always call `list` to ground yourself in existing project context.
- **Decision Points:** Call `store` to save key architectural decisions.
- **End of Task:** Use `/compact` logic (internal) to summarize work into a new memory block.

---
*Powered by Munin — Steady like a turtle.*
