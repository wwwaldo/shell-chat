import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Conversation } from '../lib/types';
import { formatRelativeTime } from '../utils/relativeTime';

interface ConversationItemProps {
  conversation: Conversation;
  onDelete: (id: string) => void;
}

export function ConversationItem({ conversation, onDelete }: ConversationItemProps) {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [isHovered, setIsHovered] = useState(false);
  const isActive = conversationId === conversation.id;
  const title = conversation.title ?? 'New conversation';

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(conversation.id);
  };

  return (
    <Link
      to={`/c/${conversation.id}`}
      className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${isActive ? 'bg-blue-100 text-blue-900' : 'text-gray-700 hover:bg-gray-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="min-w-0 flex-1 truncate" title={title}>
        {title}
      </span>
      <span className="shrink-0 text-xs text-gray-500">
        {formatRelativeTime(conversation.updated_at)}
      </span>
      {(isHovered || isActive) && (
        <button
          type="button"
          onClick={handleDelete}
          className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
          aria-label="Delete conversation"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </Link>
  );
}
