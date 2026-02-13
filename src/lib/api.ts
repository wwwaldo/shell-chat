import { auth } from './firebase';
import type { Conversation, Message, Settings } from './types';
import { ApiError } from './types';
import { mockApi } from './mockApi';

export { ApiError };
export type { Conversation, Message, Settings };

const useMockChat = import.meta.env.VITE_MOCK_CHAT === 'true';

const API_URL = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

const realApi = {
  getSettings: () =>
    request<Settings>('/settings'),

  updateApiKey: (apiKey: string) =>
    request<{ anthropic_key_set: boolean; anthropic_key_preview: string }>(
      '/settings/anthropic-key',
      { method: 'PUT', body: JSON.stringify({ api_key: apiKey }) }
    ),

  deleteApiKey: () =>
    request<void>('/settings/anthropic-key', { method: 'DELETE' }),

  listConversations: () =>
    request<{ conversations: Conversation[] }>('/conversations'),

  createConversation: () =>
    request<Conversation>('/conversations', { method: 'POST' }),

  getMessages: (conversationId: string) =>
    request<{ messages: Message[] }>(
      `/conversations/${conversationId}/messages`
    ),

  sendMessage: (conversationId: string, message: string) =>
    request<Message>(`/conversations/${conversationId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  deleteConversation: (conversationId: string) =>
    request<void>(`/conversations/${conversationId}`, { method: 'DELETE' }),
};

/** Uses real backend unless VITE_MOCK_CHAT=true (in-memory conversations + random stock assistant replies). */
export const api = useMockChat ? mockApi : realApi;
