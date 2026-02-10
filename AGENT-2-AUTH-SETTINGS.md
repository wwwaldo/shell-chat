# Agent 2: Auth & Settings

**Run after Agent 1.** You depend on: Vite/React project, Firebase, AuthContext, AuthGuard, API client (`api`), routes, Header, LoadingSpinner.

**Full spec:** [navigator-chat-app-spec.md](./navigator-chat-app-spec.md)

---

## Your scope

Implement authentication UI, settings UI, toasts, and global API error handling. Do **not** implement chat UI (ConversationList, ChatWindow, MessageList, Message, ChatInput) or ChatPage content logic; that is Agent 3.

### 1. Toast system

- Add a single approach for toasts (e.g. **react-hot-toast** or a minimal **ToastContext** + component). Use it everywhere the spec mentions toasts: Settings success/error, network error, 403, rate limit (see spec: UX Details > Toasts, Error States).
- Ensure the toast provider wraps the app (e.g. in `App.tsx` or `main.tsx`).

### 2. Login page

- **`src/pages/LoginPage.tsx`**: Replace the placeholder. Implement per spec (LoginPage):
  - Two modes: "Sign In" and "Sign Up" (tabs or toggle).
  - **Sign In:** Email, password, "Sign In" button, "Continue with Google", link to switch to Sign Up. Use `signInWithEmail` and `signInWithGoogle` from AuthContext.
  - **Sign Up:** Email, password, confirm password, "Create Account" button, "Continue with Google", link to switch to Sign In. Use `signUpWithEmail` and `signInWithGoogle`.
  - On successful auth, redirect to `/`.

### 3. Settings page and API key form

- **`src/pages/SettingsPage.tsx`**: Replace the placeholder. Layout: use Header. Two sections:
  - **API Key:** Render ApiKeyForm (see below).
  - **Account:** Show current user email (from AuthContext) and a "Sign out" button that calls `signOut` then redirects to `/login`.
- **`src/components/ApiKeyForm.tsx`**:
  - Fetch settings on mount via `api.getSettings()`.
  - If key not set: text input for API key, "Save" button. Validate that value starts with `sk-ant-` before submit. On submit call `api.updateApiKey(apiKey)`, show success toast, then refetch settings. On error show error toast.
  - If key set: show masked preview (`anthropic_key_preview`), "Update" (same as save flow) and "Remove" (call `api.deleteApiKey()`, show toast, refetch settings).
  - Use toasts for success and error on save/remove.

### 4. Global API error handling

- **401 (invalid_token):** Redirect to `/login`. You can do this in a central place (e.g. an API wrapper or a hook that catches errors from `api` calls) or in components that call the API. Ensure any protected route that receives 401 redirects to login.
- **403 (forbidden):** Show toast "You don't have access to this conversation" and redirect to `/`. This can be handled where conversation/message API is called (ChatPage/ChatWindow); if you add a small shared error-handler hook or wrapper used by both Agent 2 and Agent 3, document it for Agent 3.
- **429 (rate_limited):** Show toast "Please wait a moment".
- **Network errors:** Show toast with a generic message and optional retry (per spec: Error States).

Implement 401 and 429 (and network) in a way that works for both Settings and future Chat (e.g. a utility that given an error from `api`, shows the right toast and/or redirect). Agent 3 will use the same pattern for 403/404 in the chat flow.

---

## Integration notes

- Use `AuthContext` for `user`, `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signOut`, and `loading`.
- Use `api.getSettings()`, `api.updateApiKey()`, `api.deleteApiKey()`. Catch `ApiError` and branch on `error.code` where needed.
- Ensure `.env.example` and `.gitignore` from Agent 1 are not removed. Add any new env vars to `.env.example` if you introduce them.

---

## Out of scope (other agents)

- Chat UI: ChatPage content, ConversationList, ConversationItem, ChatWindow, MessageList, Message, ChatInput (Agent 3).
- Conversation 404 ("Conversation not found" with link to home) can be done by Agent 3 where they load a conversation; if you add a shared 404 view component, Agent 3 can reuse it.

---

## Done when

- User can sign in / sign up (email and Google) and is redirected to `/`.
- User can sign out from Settings and is redirected to `/login`.
- User can set, update, and remove API key; toasts show success/error.
- 401 from any `api` call redirects to login; 429 and network errors show toasts. 403 can be documented or stubbed so Agent 3 can plug in the same toast + redirect.
