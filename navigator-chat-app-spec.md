# Navigator Chat App Spec

## Overview

A reference chat application demonstrating integration with the Navigator personalization backend. This is a real, usable chat app with authentication, conversation management, and message persistence — not a demo or prototype.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Auth | Firebase Authentication |
| HTTP Client | fetch (or axios) |
| State | React useState/useContext (no Redux needed) |
| Markdown | react-markdown (for assistant messages; do not render raw HTML to avoid XSS; use default safe behavior or rehype-sanitize if allowing HTML later) |

---

## Firebase Setup

### Project Configuration

1. Create a Firebase project at console.firebase.google.com
2. Enable Authentication in the Firebase console
3. Enable the following sign-in providers:
   - Email/Password
   - Google

### Environment Variables

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

### Firebase SDK Initialization

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

---

## Authentication

### Auth State

The app has three auth states:

| State | Description |
|-------|-------------|
| `loading` | Firebase is initializing, auth state unknown |
| `signed_out` | No user session |
| `signed_in` | User authenticated, has valid token |

### Auth Context

```typescript
// src/context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string>;
}
```

### Token Handling

Every request to the backend includes the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

Use `getIdToken()` before each request and let Firebase return a valid token (cached or refreshed). Only force refresh (e.g. `getIdToken(true)`) if you implement retry logic after a 401.

---

## API Contract

The frontend expects the following endpoints from the Navigator backend. Base URL configured via `VITE_API_URL` environment variable.

### Authentication

All endpoints require the `Authorization: Bearer <token>` header. Backend verifies the Firebase token and extracts the user ID.

### Endpoints

#### Get User Settings

```
GET /settings
Authorization: Bearer <token>

Response 200 (key set):
{
  "anthropic_key_set": true,
  "anthropic_key_preview": "sk-ant-...a3xQ"
}

Response 200 (key not set):
{
  "anthropic_key_set": false,
  "anthropic_key_preview": null
}
```

Note: Never return the full API key. Only return whether it's set and a masked preview (first 7 chars + last 4 chars).

#### Update API Key

```
PUT /settings/anthropic-key
Authorization: Bearer <token>

Request:
{
  "api_key": "sk-ant-api03-..."
}

Response 200:
{
  "anthropic_key_set": true,
  "anthropic_key_preview": "sk-ant-...a3xQ"
}
```

Backend validates the key format, encrypts it, and stores it in Postgres.

#### Delete API Key

```
DELETE /settings/anthropic-key
Authorization: Bearer <token>

Response 204: (no content)
```

#### List Conversations

```
GET /conversations
Authorization: Bearer <token>

Response 200:
{
  "conversations": [
    {
      "id": "conv_abc123",
      "title": "Chat about Python",
      "created_at": "2025-02-10T14:30:00Z",
      "updated_at": "2025-02-10T15:45:00Z",
      "message_count": 12
    }
  ]
}
```

The `title` is auto-generated from the first user message (first ~50 chars or first sentence).

#### Create Conversation

```
POST /conversations
Authorization: Bearer <token>

Request: (empty body)

Response 201:
{
  "id": "conv_xyz789",
  "title": null,
  "created_at": "2025-02-10T16:00:00Z",
  "updated_at": "2025-02-10T16:00:00Z",
  "message_count": 0
}
```

#### Get Conversation Messages

```
GET /conversations/{conversation_id}/messages
Authorization: Bearer <token>

Response 200:
{
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "Hello!",
      "created_at": "2025-02-10T14:30:00Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "Hi there! How can I help you today?",
      "created_at": "2025-02-10T14:30:01Z"
    }
  ]
}
```

#### Send Message

```
POST /conversations/{conversation_id}/chat
Authorization: Bearer <token>

Request:
{
  "message": "What's the weather like?"
}

Response 200:
{
  "id": "msg_004",
  "role": "assistant",
  "content": "I don't have access to real-time weather data, but...",
  "created_at": "2025-02-10T14:31:00Z"
}
```

The backend handles:
- Fetching personalization context from the Navigator SDK
- Injecting personalization into the system prompt
- Calling the Anthropic API
- Logging the conversation turn via the Navigator SDK
- Storing messages in Postgres
- Returning the assistant response

**Frontend send-message flow (optimistic UI):**

1. **Optimistic update:** Append the user message to the UI immediately with a temporary id (e.g. `temp-${Date.now()}`), then call `POST .../chat`.
2. **While waiting:** Disable the chat input and show a typing indicator (three dots animation) in the message area until the assistant response is received.
3. **On success:** Append the returned assistant message to the list. The optimistic user message can keep its temporary id (the API does not return the stored user message).
4. **On failure:** Remove the optimistic user message, show a toast, and if the error is 401 redirect to login. This avoids leaving a user message with no reply.

#### Delete Conversation

```
DELETE /conversations/{conversation_id}
Authorization: Bearer <token>

Response 204: (no content)
```

### Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "invalid_token",
    "message": "Firebase token is expired or invalid"
  }
}
```

| Status | Code | Description |
|--------|------|-------------|
| 400 | `api_key_not_set` | User hasn't configured their Anthropic API key |
| 400 | `invalid_api_key` | Anthropic rejected the API key |
| 401 | `invalid_token` | Firebase token missing, expired, or invalid |
| 403 | `forbidden` | User doesn't own this conversation |
| 404 | `not_found` | Conversation doesn't exist |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Something broke |

### Types

Define these TypeScript types so the API client and components stay aligned:

**Conversation:**

```typescript
interface Conversation {
  id: string;
  title: string | null;
  created_at: string;   // ISO 8601
  updated_at: string;   // ISO 8601
  message_count: number;
}
```

**Message:**

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;   // ISO 8601
}
```

**Settings:**

```typescript
interface Settings {
  anthropic_key_set: boolean;
  anthropic_key_preview: string | null;   // null when key not set
}
```

**ApiError:**

Callers need to branch on error codes (e.g. `api_key_not_set`, `invalid_token`). Define a custom error class:

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

---

## Frontend Architecture

### File Structure

```
src/
├── main.tsx                  # App entry point
├── App.tsx                   # Router setup
├── lib/
│   ├── firebase.ts           # Firebase initialization
│   └── api.ts                # API client with auth headers
├── context/
│   └── AuthContext.tsx       # Auth state management
├── components/
│   ├── AuthGuard.tsx         # Redirects to login if not authed
│   ├── Header.tsx            # Top bar with settings icon
│   ├── ConversationList.tsx  # Sidebar with conversation history
│   ├── ConversationItem.tsx  # Single conversation in list
│   ├── ChatWindow.tsx        # Main chat area
│   ├── MessageList.tsx       # Scrollable message container
│   ├── Message.tsx           # Single message bubble
│   ├── ChatInput.tsx         # Text input + send button
│   ├── ApiKeyForm.tsx        # API key input/update form
│   └── LoadingSpinner.tsx    # Loading state
├── pages/
│   ├── LoginPage.tsx         # Sign in / sign up
│   ├── ChatPage.tsx          # Main app (sidebar + chat)
│   ├── SettingsPage.tsx      # User settings (API key, sign out)
│   └── NotFoundPage.tsx      # 404
└── styles/
    └── index.css             # Tailwind imports + any custom styles
```

### Routes

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/login` | LoginPage | No |
| `/` | ChatPage | Yes |
| `/c/{conversation_id}` | ChatPage | Yes |
| `/settings` | SettingsPage | Yes |
| `*` | NotFoundPage | No |

### Component Specifications

#### AuthGuard

Wraps protected routes. If user is not authenticated, redirects to `/login`. Shows loading spinner while Firebase initializes.

```typescript
interface AuthGuardProps {
  children: React.ReactNode;
}
```

#### LoginPage

Two tabs or toggle: "Sign In" and "Sign Up"

**Sign In:**
- Email input
- Password input
- "Sign In" button
- "Continue with Google" button
- Link to switch to Sign Up

**Sign Up:**
- Email input
- Password input
- Confirm password input
- "Create Account" button
- "Continue with Google" button
- Link to switch to Sign In

On successful auth, redirect to `/`.

#### Header

Top bar visible on all authenticated pages.

- Left: App logo/name, links to `/`
- Right: Settings icon (gear), links to `/settings`

#### SettingsPage

Simple settings page with:

**API Key section:**
- If key not set: text input for full API key, "Save" button
- If key set: masked preview (`sk-ant-...a3xQ`), "Update" / "Remove" buttons
- Validation: must start with `sk-ant-`
- Success/error toast on save

**Account section:**
- Shows user email
- "Sign out" button

#### ChatPage

Layout: sidebar on left (conversation list), main area on right (chat window).

On mount:
1. Fetch conversations list
2. If URL has conversation_id, load that conversation
3. If no conversation_id and conversations exist, redirect to `/c/{first_conversation_id}` (first in list, which is most recent by `updated_at`)
4. If no conversations exist, show empty state with "Start a new chat" button

**New conversation:** "New Chat" / "Start a new chat" calls `POST /conversations`, then navigates to `/c/{new_id}`. The new conversation has `title: null` and `message_count: 0` until the first message is sent.

**Conversation list refresh:** Refetch the list after (1) creating a conversation, (2) deleting a conversation, and (3) after sending a message so the sidebar title updates when the backend derives it from the first message. Alternatively, refetch only when `message_count` was 0 before send (first message) to avoid extra calls.

**After delete:** When the user deletes the conversation currently being viewed, redirect to `/` (or to the most recent remaining conversation if any) and refresh the list.

#### ConversationList

- "New Chat" button at top
- List of ConversationItem components
- Sorted by `updated_at` descending (most recent first)
- Active conversation highlighted
- Click to navigate to `/c/{conversation_id}`

#### ConversationItem

- Shows title (or "New conversation" if null)
- Shows relative time (e.g., "2 hours ago")
- Delete button (appears on hover)
- Clicking navigates to that conversation
- After delete: if that conversation was being viewed, parent redirects and refetches list (see ChatPage)

#### ChatWindow

- Shows MessageList for current conversation
- Shows ChatInput at bottom
- If no conversation selected, shows empty state
- **If API key not set:** shows prompt to configure API key with link to settings, chat input disabled

#### MessageList

- Scrollable container
- Auto-scrolls to bottom on new messages
- Shows loading spinner while fetching history
- Groups messages visually (user on right, assistant on left)

#### Message

```typescript
interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
```

- User messages: right-aligned, colored background (e.g., blue)
- Assistant messages: left-aligned, neutral background
- Render markdown in assistant messages with react-markdown; do not render raw HTML (use default/safe config to avoid XSS; if allowing HTML later, use something like rehype-sanitize)

#### ChatInput

- Textarea that expands up to 4 lines
- Send button (disabled when empty or loading)
- Submit on Enter (Shift+Enter for newline)
- Disabled while waiting for response; show typing indicator in the message area (see Loading States) until the assistant response is received

---

## State Management

### Global State (Context)

**AuthContext:**
- `user`: Firebase User object or null
- `loading`: boolean
- Auth methods

### Local State (per component)

**ChatPage:**
- `conversations`: Conversation[]
- `activeConversationId`: string | null
- `isLoadingConversations`: boolean

**ChatWindow:**
- `messages`: Message[]
- `isLoadingMessages`: boolean
- `isSending`: boolean

---

## API Client

```typescript
// src/lib/api.ts
import { auth } from './firebase';

const API_URL = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');  // trim trailing slash

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let code = 'internal_error';
    let message = 'Something went wrong';
    try {
      const body = await response.json();
      if (body?.error?.code) code = body.error.code;
      if (body?.error?.message) message = body.error.message;
    } catch {
      // non-JSON error body (e.g. 502 from gateway)
    }
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  // Settings
  getSettings: () =>
    request<{ anthropic_key_set: boolean; anthropic_key_preview: string | null }>('/settings'),
  
  updateApiKey: (apiKey: string) =>
    request<{ anthropic_key_set: boolean; anthropic_key_preview: string }>('/settings/anthropic-key', {
      method: 'PUT',
      body: JSON.stringify({ api_key: apiKey }),
    }),
  
  deleteApiKey: () =>
    request<void>('/settings/anthropic-key', { method: 'DELETE' }),

  // Conversations
  listConversations: () => 
    request<{ conversations: Conversation[] }>('/conversations'),
  
  createConversation: () => 
    request<Conversation>('/conversations', { method: 'POST' }),
  
  getMessages: (conversationId: string) =>
    request<{ messages: Message[] }>(`/conversations/${conversationId}/messages`),
  
  sendMessage: (conversationId: string, message: string) =>
    request<Message>(`/conversations/${conversationId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  
  deleteConversation: (conversationId: string) =>
    request<void>(`/conversations/${conversationId}`, { method: 'DELETE' }),
};
```

---

## UX Details

### Loading States

- Initial page load: full-screen spinner
- Fetching conversations: spinner in sidebar
- Fetching messages: spinner in chat area
- Sending message: input disabled, subtle spinner on send button
- Waiting for response: typing indicator (three dots animation) in message area

### Error States

- Network error: toast notification with retry option
- 401 error: redirect to login
- 403 error: show toast ("You don't have access to this conversation") and redirect to `/`
- 404 error: "Conversation not found" with link to home; optionally refetch conversation list
- Rate limited: toast with "Please wait a moment"

### Toasts

Use a single approach for all toast notifications (Settings success/error, network error, 403, rate limit): e.g. a small library like `react-hot-toast` or a minimal `ToastContext` + component.

### Empty States

- No conversations: centered message "Start your first conversation" with button
- Empty conversation: centered message "Send a message to get started"

### Responsive Design

- Desktop: sidebar visible, ~300px wide
- Mobile (<768px): sidebar hidden by default, hamburger menu to show/hide
- Chat input always visible at bottom

---

## Environment Variables

```
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=

# Backend
VITE_API_URL=http://localhost:8000
```

Provide a `.env.example` in the repo with all keys above (empty values). Ensure `.env` is in `.gitignore` so credentials are never committed.

---

## Future Considerations

> **Auth expansion:** Add more providers (GitHub, Apple) if needed. Firebase makes this trivial.

> **Real-time updates:** Currently using request/response. Could add WebSocket or SSE for streaming responses from Claude.

> **Offline support:** Service worker + IndexedDB cache for viewing past conversations offline.

> **Conversation search:** Full-text search across all conversations. Would need backend support.

> **Conversation sharing:** Generate shareable links for conversations. Privacy implications to consider.

---

## Agent Delegation Opportunities

| Task | Agent Potential | Notes |
|------|-----------------|-------|
| Firebase setup boilerplate | High | Standardized config, just needs project credentials |
| Auth context + hooks | High | Well-defined pattern, easy to generate |
| API client | High | Mechanical translation from endpoint spec |
| Component scaffolding | High | Can generate all component shells from file structure |
| Tailwind styling | Medium | Can generate base styles, may need human polish |
| Error handling | Medium | Patterns are standard but edge cases need thought |
| Responsive layout | Medium | Breakpoints are mechanical, but UX judgment needed |
| Markdown rendering | High | Just wire up react-markdown |

**Suggested delegation approach:**

1. Agent generates Firebase setup + auth context
2. Agent generates API client from endpoint spec
3. Agent scaffolds all components with props/types
4. Human reviews and adjusts styling/UX
5. Agent fills in component implementations
6. Human does final polish and testing
