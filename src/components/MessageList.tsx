import { useEffect, useRef } from 'react';
import type { Message as MessageType } from '../lib/types';
import { Message } from './Message';
import { LoadingSpinner } from './LoadingSpinner';

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
  isSending: boolean;
}

export function MessageList({ messages, isLoading, isSending }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Message
              key={msg.id}
              role={msg.role}
              content={msg.content}
              createdAt={msg.created_at}
            />
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-gray-100 px-4 py-2.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
