import type { Conversation, Message, Settings } from './types';
import { ApiError } from './types';

const STOCK_RESPONSES = [
  "That's a great question! I'd be happy to help with that.",
  "Here's what I think: that could work. Want to go deeper on it?",
  "Good point. Let me suggest a few options and you can pick what fits.",
  "I don't have access to real-time data, but based on general knowledge, here's my take.",
  "Sure thing. One way to approach this is to start with the basics and build up.",
  "Interesting! I'd need a bit more context to give a precise answer, but here's a rough idea.",
  "Thanks for asking. Here's a concise summary you can use.",
  "I'm not sure I have the full picture, but a common approach would be to try this first.",
  "Got it. Here are a couple of paths forward—see which one fits your case.",
  "That makes sense. My suggestion would be to break it down into smaller steps.",
];

function genId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function now(): string {
  return new Date().toISOString();
}

// In-memory state (per page load)
const conversations: Conversation[] = [];
const messagesByConv: Record<string, Message[]> = {};

function getOrCreateMessages(conversationId: string): Message[] {
  if (!messagesByConv[conversationId]) {
    messagesByConv[conversationId] = [];
  }
  return messagesByConv[conversationId];
}

function titleFromContent(content: string): string {
  const firstLine = content.split('\n')[0]?.trim() ?? '';
  if (firstLine.length <= 50) return firstLine || 'New conversation';
  return firstLine.slice(0, 47) + '...';
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockApi = {
  getSettings(): Promise<Settings> {
    return Promise.resolve({
      anthropic_key_set: true,
      anthropic_key_preview: 'sk-ant-...mock',
    });
  },

  updateApiKey(_apiKey: string): Promise<{ anthropic_key_set: boolean; anthropic_key_preview: string }> {
    return Promise.resolve({
      anthropic_key_set: true,
      anthropic_key_preview: 'sk-ant-...mock',
    });
  },

  deleteApiKey(): Promise<void> {
    return Promise.resolve();
  },

  listConversations(): Promise<{ conversations: Conversation[] }> {
    const sorted = [...conversations].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    return Promise.resolve({ conversations: sorted });
  },

  createConversation(): Promise<Conversation> {
    const id = genId('conv');
    const nowStr = now();
    const conv: Conversation = {
      id,
      title: null,
      created_at: nowStr,
      updated_at: nowStr,
      message_count: 0,
    };
    conversations.push(conv);
    messagesByConv[id] = [];
    return Promise.resolve(conv);
  },

  getMessages(conversationId: string): Promise<{ messages: Message[] }> {
    const messages = getOrCreateMessages(conversationId);
    return Promise.resolve({ messages: [...messages] });
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) {
      throw new ApiError(404, 'not_found', 'Conversation not found');
    }

    const userMsg: Message = {
      id: genId('msg'),
      role: 'user',
      content,
      created_at: now(),
    };
    const list = getOrCreateMessages(conversationId);
    list.push(userMsg);

    if (conv.message_count === 0) {
      conv.title = titleFromContent(content);
    }
    conv.message_count += 1;
    conv.updated_at = now();

    await delay(800 + Math.random() * 700);

    const stock =
      STOCK_RESPONSES[Math.floor(Math.random() * STOCK_RESPONSES.length)];
    const assistantMsg: Message = {
      id: genId('msg'),
      role: 'assistant',
      content: stock,
      created_at: now(),
    };
    list.push(assistantMsg);
    conv.updated_at = now();

    return Promise.resolve(assistantMsg);
  },

  deleteConversation(conversationId: string): Promise<void> {
    const idx = conversations.findIndex((c) => c.id === conversationId);
    if (idx === -1) {
      throw new ApiError(404, 'not_found', 'Conversation not found');
    }
    conversations.splice(idx, 1);
    delete messagesByConv[conversationId];
    return Promise.resolve();
  },
};
