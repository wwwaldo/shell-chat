import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { handleApiError } from '../lib/apiErrorHandler';
import type { Message as MessageType } from '../lib/types';
import { ApiError } from '../lib/types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  conversationId: string | null;
  onMessageSent?: () => void;
}

export function ChatWindow({ conversationId, onMessageSent }: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [apiKeySet, setApiKeySet] = useState<boolean | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setNotFound(false);
      return;
    }
    setNotFound(false);
    setIsLoadingMessages(true);
    api
      .getSettings()
      .then((s) => setApiKeySet(s.anthropic_key_set))
      .catch(() => setApiKeySet(false));

    api
      .getMessages(conversationId)
      .then((res) => {
        setMessages(res.messages);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          setMessages([]);
        } else if (err instanceof ApiError && err.status === 403) {
          handleApiError(err);
        } else {
          handleApiError(err);
        }
      })
      .finally(() => setIsLoadingMessages(false));
  }, [conversationId]);

  const handleSend = (text: string) => {
    if (!conversationId || isSending) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageType = {
      id: tempId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setIsSending(true);

    api
      .sendMessage(conversationId, text)
      .then((assistantMessage) => {
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId);
          return [...withoutTemp, optimistic, assistantMessage];
        });
        onMessageSent?.();
      })
      .catch((err) => {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        if (!handleApiError(err)) {
          toast.error(err instanceof Error ? err.message : 'Failed to send message');
        }
      })
      .finally(() => setIsSending(false));
  };

  if (!conversationId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-gray-500">Send a message to get started</p>
        <p className="text-sm text-gray-400">Select a conversation or start a new chat</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-gray-700">Conversation not found</p>
        <Link to="/" className="text-blue-600 underline hover:text-blue-800">
          Go home
        </Link>
      </div>
    );
  }

  if (apiKeySet === false) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-gray-700">Configure your API key to send messages</p>
        <Link
          to="/settings"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Open Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <MessageList
        messages={messages}
        isLoading={isLoadingMessages}
        isSending={isSending}
      />
      <ChatInput disabled={isSending || apiKeySet !== true} onSubmit={handleSend} />
    </div>
  );
}
