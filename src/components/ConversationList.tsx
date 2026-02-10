import type { Conversation } from '../lib/types';
import { ConversationItem } from './ConversationItem';
import { LoadingSpinner } from './LoadingSpinner';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onSidebarClose?: () => void;
}

export function ConversationList({
  conversations,
  activeConversationId: _activeConversationId,
  isLoading,
  onNewChat,
  onDelete,
  onSidebarClose,
}: ConversationListProps) {
  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="shrink-0 border-b border-gray-200 p-2">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onSidebarClose?.();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No conversations yet</p>
        ) : (
          <ul className="space-y-0.5">
            {sorted.map((c) => (
              <li key={c.id}>
                <ConversationItem conversation={c} onDelete={onDelete} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
