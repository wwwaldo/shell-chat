# Navigator Chat App — Agent Delegation

The implementation is split across **three agents**. Use the task files below; each references the full [navigator-chat-app-spec.md](./navigator-chat-app-spec.md).

| Order | Task file | Scope |
|-------|-----------|--------|
| **1** | [AGENT-1-FOUNDATION.md](./AGENT-1-FOUNDATION.md) | Project scaffold, Firebase, types, API client, AuthContext, AuthGuard, router, Header, LoadingSpinner, NotFoundPage, placeholders for Login/Chat/Settings |
| **2** | [AGENT-2-AUTH-SETTINGS.md](./AGENT-2-AUTH-SETTINGS.md) | Toasts, LoginPage, SettingsPage, ApiKeyForm, global API error handling (401, 403, 429, network) |
| **3** | [AGENT-3-CHAT.md](./AGENT-3-CHAT.md) | ChatPage, ConversationList, ConversationItem, ChatWindow, MessageList, Message, ChatInput, optimistic send flow, responsive layout |

**Run order**

1. Run **Agent 1** first (foundation and API).
2. Run **Agent 2** and **Agent 3** after; they can run in parallel. Agent 2 owns auth/settings; Agent 3 owns chat UI. Both assume the API client and routes from Agent 1 exist.

**Handoff**

- Give each agent only its task file (e.g. “Implement everything in AGENT-2-AUTH-SETTINGS.md”) and point them at the main spec for reference.
- Agent 1 creates placeholder pages so the app runs and routes resolve; Agent 2 and 3 replace those placeholders with real implementations.
