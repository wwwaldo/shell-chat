# Agent task: Implement the Navigator Chat backend

Implement the backend API described in **[BACKEND-SPEC.md](./BACKEND-SPEC.md)** so the existing frontend can talk to it at **http://localhost:8000**.

## What to do

1. **Read BACKEND-SPEC.md** — it is the source of truth for endpoints, auth, errors, data model, and chat flow.
2. **Create the backend** in a new `backend/` directory in this repo (or in a sibling folder if you prefer). Do not put backend code in the existing `src/` (that is the Vite frontend).
3. **Tech stack:** Use either **Node.js + Express + TypeScript** or **Python + FastAPI** as suggested in the spec. Use **Postgres** (or SQLite for local dev). Use **Firebase Admin** (or equivalent) to verify the `Authorization: Bearer <token>` and get the user id.
4. **Implement every endpoint** in the spec with the exact request/response shapes and error codes. Enable **CORS** for `http://localhost:5173`.
5. **Chat flow:** Store user message, call Anthropic API with the user’s stored API key, store assistant message, update conversation title if first message, return assistant message. You may **omit the Navigator SDK** for v1 and use a simple system prompt.
6. **Run on port 8000:** Document in the backend README how to set `PORT=8000` (or default to 8000) and run the server (e.g. `npm run dev` or `uvicorn ...`).
7. **README:** In `backend/README.md` (or equivalent) document: env vars (including `DATABASE_URL`, `FIREBASE_PROJECT_ID`), how to run migrations (if any), and how to start the server.

## Done when

- Backend runs on `http://localhost:8000`.
- Frontend at `http://localhost:5173` with `VITE_API_URL=http://localhost:8000` can: sign in, get/update/delete API key in Settings, list/create/delete conversations, load messages, send a message and get an assistant reply.
- No CORS errors when the frontend calls the backend.

## Reference

- **API contract (frontend view):** [navigator-chat-app-spec.md](./navigator-chat-app-spec.md) — “API Contract” and “Error Responses” sections.
- **Backend spec (your spec):** [BACKEND-SPEC.md](./BACKEND-SPEC.md).
