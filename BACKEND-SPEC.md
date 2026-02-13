# Navigator Chat — Backend API Spec

Backend for the Navigator Chat frontend. Must run on **localhost:8000** (or configurable port) and implement the API contract the frontend expects.

**Frontend spec (API contract):** [navigator-chat-app-spec.md](./navigator-chat-app-spec.md) — “API Contract” and “Error Responses” sections.

---

## Goal

- Serve the REST API at `http://localhost:8000` (or `PORT` env).
- Verify Firebase ID tokens and scope all data by user.
- Store settings, conversations, and messages (e.g. Postgres).
- Handle chat by calling the Anthropic API and optionally the Navigator SDK for personalization.

---

## Tech stack (suggestion)

Pick one and stick to it:

| Option | Stack | Notes |
|--------|--------|--------|
| A | **Node.js + Express + TypeScript** | Same language as frontend, easy to share types. Use `firebase-admin` to verify tokens. |
| B | **Python + FastAPI** | Fast to implement, automatic OpenAPI. Use `firebase-admin` or HTTP call to verify tokens. |

Use **Postgres** for persistence (or SQLite for local-only). Enable **CORS** for the frontend origin (e.g. `http://localhost:5173`).

---

## Environment variables

```
PORT=8000
DATABASE_URL=postgresql://...   # or sqlite for local dev

# Firebase (for verifying ID tokens)
FIREBASE_PROJECT_ID=your-project-id
# Option A (Node): path to service account JSON, or
# Option B: Firebase Admin SDK init with default credentials / env

# Optional: Navigator SDK (if you integrate it)
# NAVIGATOR_... as per SDK docs
```

---

## Auth (every request)

1. Read `Authorization: Bearer <token>`.
2. If missing or invalid → **401** `invalid_token`.
3. Verify the token with Firebase Admin (or Firebase token verification API) and get **uid**.
4. Attach **uid** to the request and use it for all DB lookups (conversations and settings are per user).

---

## Endpoints (summary)

| Method | Path | Description |
|--------|------|-------------|
| GET | /settings | User settings (API key set + masked preview) |
| PUT | /settings/anthropic-key | Set/update Anthropic API key (body: `{ "api_key": "sk-ant-..." }`) |
| DELETE | /settings/anthropic-key | Remove stored API key |
| GET | /conversations | List user’s conversations (sorted by updated_at desc) |
| POST | /conversations | Create conversation (empty body), return new conversation |
| GET | /conversations/:id/messages | List messages for conversation (403 if not owner, 404 if missing) |
| POST | /conversations/:id/chat | Send user message, call Claude, return assistant message (body: `{ "message": "..." }`) |
| DELETE | /conversations/:id | Delete conversation (403 if not owner, 204 on success) |

All responses are JSON except **204** (no content). All errors use the shape below.

---

## Error response format

Every error response:

```json
{
  "error": {
    "code": "<code>",
    "message": "<human-readable message>"
  }
}
```

| HTTP | code | When |
|------|------|------|
| 400 | api_key_not_set | User has no stored Anthropic key but tried to chat |
| 400 | invalid_api_key | Anthropic rejected the API key (e.g. invalid or revoked) |
| 401 | invalid_token | Missing/expired/invalid Firebase token |
| 403 | forbidden | User does not own this conversation |
| 404 | not_found | Conversation id not found |
| 429 | rate_limited | Too many requests (optional to implement) |
| 500 | internal_error | Unexpected server error |

---

## Data model (conceptual)

- **Settings (per user):** `user_id`, encrypted `anthropic_api_key` (or null), `anthropic_key_preview` (masked, e.g. first 7 + last 4 chars). Table or key-value by uid.
- **Conversations:** `id` (e.g. `conv_xxx`), `user_id`, `title` (nullable), `created_at`, `updated_at`. `title` set when the first user message is added (e.g. first ~50 chars or first sentence).
- **Messages:** `id` (e.g. `msg_xxx`), `conversation_id`, `role` (user | assistant), `content`, `created_at`. Order by `created_at`.

IDs: use UUIDs or nanoid and prefix with `conv_` / `msg_` so the frontend sees `conv_abc123`, `msg_001`, etc.

---

## Settings endpoints (detail)

- **GET /settings**  
  - Auth required.  
  - Return `{ "anthropic_key_set": true|false, "anthropic_key_preview": "sk-ant-...a3xQ" | null }`.  
  - Never return the raw API key.

- **PUT /settings/anthropic-key**  
  - Body: `{ "api_key": "sk-ant-..." }`.  
  - Validate format (starts with `sk-ant-`), optionally sanity-check with Anthropic.  
  - Encrypt and store per user; set preview (e.g. first 7 + last 4 chars).  
  - Response: same shape as GET /settings.

- **DELETE /settings/anthropic-key**  
  - Clear stored key for user.  
  - Response: **204** no content.

---

## Conversation endpoints (detail)

- **GET /conversations**  
  - Return list of conversations for the authenticated user.  
  - Each: `id`, `title`, `created_at`, `updated_at`, `message_count`.  
  - Sorted by `updated_at` descending.

- **POST /conversations**  
  - Create a new conversation for the user (no body).  
  - Return **201** and conversation object with `title: null`, `message_count: 0`.

- **GET /conversations/:id/messages**  
  - If conversation does not exist → **404** not_found.  
  - If conversation belongs to another user → **403** forbidden.  
  - Return `{ "messages": [ ... ] }` ordered by `created_at`.

- **POST /conversations/:id/chat**  
  - Body: `{ "message": "user text" }`.  
  - 404 if conversation missing, 403 if not owner.  
  - If user has no stored Anthropic key → **400** api_key_not_set.  
  - Store user message; fetch user’s API key; call Anthropic API to get assistant reply; store assistant message; update conversation `updated_at` and set `title` from first user message if not yet set.  
  - Return **200** with the new assistant message object: `{ id, role: "assistant", content, created_at }`.

- **DELETE /conversations/:id**  
  - 404 if not found, 403 if not owner.  
  - Delete conversation and its messages (or cascade).  
  - Return **204**.

---

## Chat flow (POST .../chat) — detailed

1. Resolve conversation and check ownership (404/403).
2. Load user’s stored Anthropic API key; if missing → 400 api_key_not_set.
3. Persist the **user** message and get its id (and conversation’s message count).
4. If this is the first message in the conversation, set conversation `title` from the user message (e.g. first ~50 chars or first sentence).
5. Build messages for Claude: include prior conversation messages (and optionally system prompt with Navigator personalization — see below).
6. Call **Anthropic API** (e.g. Messages API) with the user’s API key. On invalid key → 400 invalid_api_key.
7. Persist the **assistant** message.
8. Update conversation `updated_at`.
9. (Optional) If you integrate **Navigator SDK**: fetch personalization context and inject into system prompt; after the turn, log the conversation turn to Navigator.
10. Return the assistant message as JSON: `{ id, role: "assistant", content, created_at }`.

---

## Navigator SDK (optional for v1)

The frontend spec mentions “Navigator personalization backend” and “Navigator SDK”. For a **first version** you can:

- Omit the Navigator SDK and use a fixed system prompt (e.g. “You are a helpful assistant.”).
- Add Navigator later: fetch context, add it to the system prompt, and log turns after storing the message.

If you do integrate Navigator, follow its docs for initializing the SDK and for the personalization + logging APIs.

---

## CORS

Allow the frontend origin so the browser can call the API. Example for local dev:

- Origin: `http://localhost:5173` (and optionally `http://127.0.0.1:5173`).
- Methods: GET, POST, PUT, DELETE.
- Headers: `Content-Type`, `Authorization`.

---

## Health check (optional)

- **GET /health** or **GET /**  
  - Return 200 with a simple body (e.g. `{ "status": "ok" }`) for readiness checks. No auth required.

---

## Agent instructions (how to implement)

1. Create a new directory or repo for the backend (e.g. `backend/` in this repo or a sibling folder).
2. Initialize the project (Node + Express + TS **or** Python + FastAPI), add dependencies (Firebase Admin, Postgres client, Anthropic SDK).
3. Implement middleware: extract Bearer token, verify with Firebase, attach `uid` to request (or return 401).
4. Implement each endpoint per this spec and the frontend’s API contract. Use the same error JSON shape and status codes.
5. Add CORS for `http://localhost:5173`.
6. Add a README with: how to set env vars, run migrations (if any), and start the server (e.g. `PORT=8000 npm run dev`).
7. Test: start backend on 8000, start frontend, sign in, create conversation, send message. Confirm settings and conversation list work.

**Done when:** Frontend at localhost:5173 can sign in, set API key in Settings, create conversations, send messages, and see assistant replies with the backend running on localhost:8000.
