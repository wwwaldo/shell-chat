# Agent 1: Foundation & API

**Run this agent first.** Agents 2 and 3 depend on the project scaffold and API client.

**Full spec:** [navigator-chat-app-spec.md](./navigator-chat-app-spec.md)

---

## Your scope

Implement the following. Do **not** implement LoginPage, SettingsPage, ApiKeyForm, or any chat UI (ConversationList, ChatWindow, MessageList, Message, ChatInput, ChatPage content). Other agents will build those.

### 1. Project setup

- Create a **Vite + React + TypeScript** project in this repo (or ensure it exists).
- Add **Tailwind CSS** and configure it.
- Add **React Router** (e.g. `react-router-dom`).
- Add **Firebase** (`firebase` package).
- Add **react-markdown** (used later by Agent 3; include so dependency is present).
- Create the **folder structure** from the spec (see Frontend Architecture > File Structure). Create empty or minimal placeholder files for components/pages you are not implementing so imports resolve.

### 2. Environment & repo hygiene

- Add **`.env.example`** with all variables from the spec (Environment Variables section), empty values.
- Ensure **`.env`** is in **`.gitignore`** so credentials are never committed.

### 3. Firebase

- **`src/lib/firebase.ts`**: Initialize Firebase app and export `auth` using env vars as in the spec (Firebase SDK Initialization). Use `getAuth(app)`.

### 4. Types and API client

- **Types:** Define in `src/lib/api.ts` (or a separate `src/lib/types.ts`) and export:
  - `Conversation` (id, title | null, created_at, updated_at, message_count)
  - `Message` (id, role, content, created_at)
  - `Settings` (anthropic_key_set, anthropic_key_preview | null)
  - `ApiError` class (status, code, message) as in the spec (Types > ApiError).
- **`src/lib/api.ts`**: Implement the full API client from the spec (API Client section):
  - Base URL from `VITE_API_URL` with **trailing slash trimmed**.
  - `request<T>()` using `getIdToken()` (no force refresh), `Authorization: Bearer <token>`, and throwing `ApiError` on non-2xx. Handle non-JSON error bodies (fallback code `internal_error`, generic message). Handle 204 with no content.
  - Export `api` with: `getSettings`, `updateApiKey`, `deleteApiKey`, `listConversations`, `createConversation`, `getMessages`, `sendMessage`, `deleteConversation`.

### 5. Auth context and guard

- **`src/context/AuthContext.tsx`**: Provide the interface from the spec (Auth Context): `user`, `loading`, `signInWithGoogle`, `signInWithEmail`, `signUpWithEmail`, `signOut`, `getIdToken`. Wrap app in a provider that listens to Firebase auth state.
- **`src/components/AuthGuard.tsx`**: Accept `children`. If `loading`, show a loading spinner. If not authenticated, redirect to `/login`. Otherwise render `children`.

### 6. Router and shell layout

- **`src/App.tsx`**: Set up React Router with routes from the spec (Routes table):
  - `/login` → LoginPage (placeholder or minimal "Login" text for now so Agent 2 can replace)
  - `/` and `/c/:conversationId` → Wrap in AuthGuard, render ChatPage (placeholder or minimal "Chat" text so Agent 3 can replace)
  - `/settings` → Wrap in AuthGuard, render SettingsPage (placeholder so Agent 2 can replace)
  - `*` → NotFoundPage
- **`src/main.tsx`**: Render app wrapped in `AuthContext` provider (and Router if not in App).
- **`src/components/Header.tsx`**: Top bar: left = app name/logo linking to `/`, right = settings icon linking to `/settings`. Visible on authenticated pages (Agent 2/3 will compose it into layouts).
- **`src/components/LoadingSpinner.tsx`**: Simple reusable loading spinner (used by AuthGuard and elsewhere).
- **`src/pages/NotFoundPage.tsx`**: Simple 404 message and link to home.
- **`src/styles/index.css`**: Tailwind directives and any base styles.

### 7. Placeholder pages (minimal)

So routes don’t break before other agents run:

- **`src/pages/LoginPage.tsx`**: Minimal placeholder (e.g. "Login — to be implemented by Agent 2" or a simple div).
- **`src/pages/ChatPage.tsx`**: Minimal placeholder (e.g. layout with Header + "Chat — to be implemented by Agent 3").
- **`src/pages/SettingsPage.tsx`**: Minimal placeholder (e.g. Header + "Settings — to be implemented by Agent 2").

---

## Out of scope (other agents)

- LoginPage real implementation (Agent 2)
- SettingsPage, ApiKeyForm (Agent 2)
- Toasts / error handling UI (Agent 2)
- ChatPage content, ConversationList, ConversationItem, ChatWindow, MessageList, Message, ChatInput (Agent 3)

---

## Done when

- `npm run build` (or equivalent) succeeds.
- Visiting `/login` shows the placeholder; visiting `/` or `/settings` when logged out redirects to `/login`; when logged in, placeholders for Chat and Settings render with Header.
- `api.getSettings()`, `api.listConversations()`, etc. are callable and types are in place for other agents to use.
