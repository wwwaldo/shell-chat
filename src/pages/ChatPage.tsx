import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { handleApiError } from '../lib/apiErrorHandler';
import type { Conversation } from '../lib/types';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConversationList } from '../components/ConversationList';
import { ChatWindow } from '../components/ChatWindow';

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendUnreachable, setBackendUnreachable] = useState(false);

  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setBackendUnreachable(false);
    try {
      const res = await api.listConversations();
      setConversations(res.conversations);
    } catch (err) {
      const isNetworkError =
        err instanceof TypeError && err.message === 'Failed to fetch';
      if (isNetworkError) setBackendUnreachable(true);
      handleApiError(err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (isLoadingConversations) return;
    const hasId = !!conversationId;
    const list = conversations;
    if (!hasId && list.length > 0) {
      const first = [...list].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];
      navigate(`/c/${first.id}`, { replace: true });
    }
  }, [conversationId, conversations, isLoadingConversations, navigate]);

  const handleNewChat = async () => {
    try {
      const created = await api.createConversation();
      await fetchConversations();
      navigate(`/c/${created.id}`);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      await fetchConversations();
      if (conversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        const next = remaining.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0];
        if (next) navigate(`/c/${next.id}`);
        else navigate('/');
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleMessageSent = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  const activeId = conversationId ?? null;
  const hasConversations = conversations.length > 0;
  const willRedirectToFirst = !activeId && hasConversations && !isLoadingConversations;

  return (
    <div className="flex h-screen flex-col">
      <Header />
      {backendUnreachable && (
        <div
          className="shrink-0 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900"
          role="alert"
        >
          API server not running. Start the backend at the URL in{' '}
          <code className="rounded bg-amber-200 px-1">VITE_API_URL</code> (e.g.{' '}
          <code className="rounded bg-amber-200 px-1">http://localhost:8000</code>
          ). See README.
        </div>
      )}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}
        {/* Sidebar */}
        <aside
          className={`absolute left-0 top-0 z-30 h-full w-[300px] shrink-0 border-r border-gray-200 bg-gray-50 md:relative md:z-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } transition-transform`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeId}
            isLoading={isLoadingConversations}
            onNewChat={handleNewChat}
            onDelete={handleDeleteConversation}
            onSidebarClose={() => setSidebarOpen(false)}
          />
        </aside>
        {/* Main area */}
        <main className="flex flex-1 flex-col overflow-hidden bg-white">
          {willRedirectToFirst ? (
            <div className="flex flex-1 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : !activeId && !isLoadingConversations && !hasConversations ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="text-gray-600">Start your first conversation</p>
              <button
                type="button"
                onClick={handleNewChat}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Start a new chat
              </button>
            </div>
          ) : (
            <ChatWindow conversationId={activeId} onMessageSent={handleMessageSent} />
          )}
        </main>
        {/* Hamburger: show on mobile when sidebar is hidden */}
        <button
          type="button"
          className="absolute left-4 top-4 z-10 rounded-lg border border-gray-200 bg-white p-2 md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
