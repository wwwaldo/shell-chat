# Agent 3: Chat

**Run after Agent 1.** You may run in parallel with Agent 2. You depend on: Vite/React project, AuthContext, AuthGuard, API client (`api`), routes, Header, LoadingSpinner. If Agent 2 has not run yet, assume toasts and global error handling will be available (use the same toast mechanism and 401/403/404 patterns from the spec).

**Full spec:** [navigator-chat-app-spec.md](./navigator-chat-app-spec.md)

---

## Your scope

Implement all conversation and message UI, state, and API integration. Do **not** implement LoginPage, SettingsPage, or ApiKeyForm (Agent 2).

### 1. Chat page

- **`src/pages/ChatPage.tsx`**: Replace the placeholder.
  - **Layout:** Sidebar (left) + main area (right). Sidebar contains ConversationList; main area contains ChatWindow. Include Header in the layout.
  - **State:** `conversations`, `activeConversationId` (from route `/c/:conversationId`), `isLoadingConversations`.
  - **On mount:** Fetch `api.listConversations()`. Then: if route has `conversationId`, use it; if no id and list length > 0, redirect to `/c/{first.id}` (first = most recent); if no conversations, show empty state with "Start a new chat" button.
  - **New conversation:** "New Chat" / "Start a new chat" calls `api.createConversation()`, then navigate to `/c/{new.id}`. Refetch conversation list after create.
  - **List refresh:** Refetch list after delete and after sending a message (or only when it was the first message in the conversation—see spec).
  - **After delete:** If the deleted conversation is the one currently viewed, redirect to `/` or to the most recent remaining conversation and refetch list.
  - **404:** If loading messages returns 404, show "Conversation not found" with link to home (and optionally refetch list). Use the same toast/error pattern as the rest of the app for 403 (toast + redirect to `/`).

### 2. Conversation list and item

- **`src/components/ConversationList.tsx`**: "New Chat" button at top; list of ConversationItem; sorted by `updated_at` descending; highlight active conversation (match `conversationId` from route). Clicking an item navigates to `/c/{id}`. Receive `conversations`, `activeConversationId`, and callbacks (e.g. onNewChat, onDelete) from ChatPage.
- **`src/components/ConversationItem.tsx`**: Display title (or "New conversation" if null), relative time (e.g. "2 hours ago"), delete button on hover. Click navigates to that conversation; delete calls parent callback so ChatPage can call `api.deleteConversation(id)`, then redirect if needed and refetch list.

### 3. Chat window, messages, input

- **`src/components/ChatWindow.tsx`**: Receives `conversationId` (or null). If no conversation, show empty state ("Send a message to get started" or similar). If conversation exists, show MessageList and ChatInput. If API key is not set (call `api.getSettings()` or receive from parent), show prompt to configure API key with link to `/settings` and disable chat input. Otherwise load messages and allow sending.
- **`src/components/MessageList.tsx`**: Scrollable container; auto-scroll to bottom on new messages; loading spinner while fetching; messages grouped visually (user right, assistant left). Show typing indicator (three dots) when `isSending` (or equivalent) is true.
- **`src/components/Message.tsx`**: Props: `role`, `content`, `createdAt`. User: right-aligned, colored background (e.g. blue). Assistant: left-aligned, neutral background. Render assistant content with **react-markdown**; do not render raw HTML (safe config to avoid XSS).
- **`src/components/ChatInput.tsx`**: Textarea (expand up to 4 lines), Send button (disabled when empty or loading). Submit on Enter; Shift+Enter for newline. Disabled while waiting for assistant response.

### 4. Send-message flow (optimistic UI)

- On submit: append user message to local state immediately with a temporary id (e.g. `temp-${Date.now()}`). Call `api.sendMessage(conversationId, message)`. While waiting, set sending state (typing indicator in MessageList, disable input). On success: append returned assistant message to list. On failure: remove the optimistic user message, show toast; if 401, redirect to login (should be handled by shared error handling from Agent 2 if present).

### 5. Loading and empty states

- Loading: fetching conversations → spinner in sidebar; fetching messages → spinner in chat area; sending → spinner on send button + typing indicator in message area (per spec).
- Empty: no conversations → "Start your first conversation" with button; empty conversation → "Send a message to get started".

### 6. Responsive design

- Desktop: sidebar visible, ~300px wide.
- Mobile (<768px): sidebar hidden by default; hamburger menu to show/hide. Chat input always visible at bottom.

---

## Integration notes

- Use `api.listConversations`, `api.createConversation`, `api.getMessages`, `api.sendMessage`, `api.deleteConversation`, and `api.getSettings` (for API key check in ChatWindow).
- Use route param for `conversationId` (e.g. React Router `useParams()`). Use `useNavigate()` for redirects after create, delete, and errors.
- Use the same toast mechanism as the rest of the app (from Agent 2) for send failures, 403, and optionally 404. If Agent 2 has not added a toast lib yet, add the same one (e.g. react-hot-toast) so behavior is consistent.

---

## Out of scope (Agent 1 and 2)

- Firebase, AuthContext, AuthGuard, API client, routes, Header, LoadingSpinner (Agent 1).
- LoginPage, SettingsPage, ApiKeyForm (Agent 2). Rely on AuthGuard for redirect when not logged in.

---

## Done when

- User can open the app, see conversation list (or empty state), create a new conversation, and be taken to `/c/{id}`.
- User can send messages with optimistic UI and typing indicator; assistant reply appears; list refreshes so sidebar title updates after first message.
- User can delete a conversation; if viewing it, redirects and list refreshes. 403/404 show correct toast and redirect. Responsive layout works (sidebar + hamburger on mobile).
