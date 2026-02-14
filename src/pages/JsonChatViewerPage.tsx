import { useState, useCallback, useMemo, useEffect } from 'react';
import { Message } from '@/components/Message';
import { featureFlags } from '@/lib/featureFlags';

const TAGS_STORAGE_KEY = 'json-chat-viewer-tags';

interface ChatMessage {
  uuid: string;
  text: string;
  sender: 'human' | 'assistant';
  created_at: string;
}

interface JsonConversation {
  uuid: string;
  name: string;
  summary: string;
  created_at: string;
  updated_at: string;
  chat_messages: ChatMessage[];
}

function loadTags(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(TAGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveTags(tags: Record<string, string[]>) {
  localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
}

function conversationMatchesSearch(conv: JsonConversation, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  if (conv.name.toLowerCase().includes(q)) return true;
  if (conv.summary.toLowerCase().includes(q)) return true;
  return conv.chat_messages.some(
    (m) => m.text.toLowerCase().includes(q)
  );
}

export function JsonChatViewerPage() {
  const [conversations, setConversations] = useState<JsonConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState<Record<string, string[]>>(loadTags);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');


  const parseFile = useCallback((file: File) => {
    setError(null);
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text) as JsonConversation[];

        if (!Array.isArray(data)) {
          setError('Expected an array of conversations');
          setConversations([]);
          return;
        }

        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setConversations(sorted);
        setSelectedId(sorted[0]?.uuid ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse JSON');
        setConversations([]);
        setSelectedId(null);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };
    reader.readAsText(file);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
      e.target.value = '';
    },
    [parseFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.json')) parseFile(file);
    },
    [parseFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    Object.values(tags).forEach((arr) => arr.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [tags]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      if (!conversationMatchesSearch(conv, searchQuery)) return false;
      if (tagFilter) {
        const convTags = tags[conv.uuid] ?? [];
        if (!convTags.includes(tagFilter)) return false;
      }
      return true;
    });
  }, [conversations, searchQuery, tagFilter, tags]);

  const addTag = useCallback((convId: string, tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    setTags((prev) => {
      const convTags = prev[convId] ?? [];
      if (convTags.includes(t)) return prev;
      const next = { ...prev, [convId]: [...convTags, t] };
      saveTags(next);
      return next;
    });
    setNewTagInput('');
  }, []);

  const removeTag = useCallback((convId: string, tag: string) => {
    setTags((prev) => {
      const convTags = (prev[convId] ?? []).filter((t) => t !== tag);
      const next = { ...prev, [convId]: convTags };
      if (convTags.length === 0) {
        const { [convId]: _, ...rest } = next;
        saveTags(rest);
        return rest;
      }
      saveTags(next);
      return next;
    });
  }, []);

  const selected = conversations.find((c) => c.uuid === selectedId);
  const selectedTags = selectedId ? (tags[selectedId] ?? []) : [];

  useEffect(() => {
    if (filteredConversations.length === 0) return;
    const ids = new Set(filteredConversations.map((c) => c.uuid));
    if (selectedId && !ids.has(selectedId)) {
      setSelectedId(filteredConversations[0].uuid);
    }
  }, [filteredConversations, selectedId]);

  if (conversations.length === 0 && !error && !isLoading) {
    return (
      <div className="flex h-screen flex-col bg-gray-50">
        <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">JSON Chat Viewer</h1>
        </header>
        <div
          className="flex flex-1 flex-col items-center justify-center gap-4 p-8"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <p className="text-gray-600">
            Drop your <code className="rounded bg-gray-200 px-1.5 py-0.5">conversations.json</code> here, or
          </p>
          <label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            Select file
            <input
              type="file"
              accept=".json"
              className="sr-only"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">JSON Chat Viewer</h1>
        <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
          Load another file
          <input
            type="file"
            accept=".json"
            className="sr-only"
            onChange={handleFileSelect}
          />
        </label>
        {featureFlags.bulkUpload && (
          <button
            type="button"
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            disabled
            title="Bulk upload (coming soon)"
          >
            Upload to backend
          </button>
        )}
      </header>

      {error && (
        <div className="shrink-0 bg-red-50 px-4 py-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {!isLoading && conversations.length > 0 && (
        <div className="flex flex-1 overflow-hidden">
          <aside className="flex w-80 shrink-0 flex-col border-r border-gray-200 bg-white">
            <div className="shrink-0 space-y-2 border-b border-gray-200 p-2">
              <input
                type="search"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-xs text-gray-500">Filter by tag:</span>
                <select
                  value={tagFilter ?? ''}
                  onChange={(e) => setTagFilter(e.target.value || null)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  {allTags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto p-2">
              {filteredConversations.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-gray-500">
                  No conversations match
                </li>
              ) : (
                filteredConversations.map((conv) => {
                  const convTags = tags[conv.uuid] ?? [];
                  return (
                    <li key={conv.uuid}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(conv.uuid)}
                        className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          selectedId === conv.uuid
                            ? 'bg-blue-100 text-blue-900'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="line-clamp-2 font-medium">
                          {conv.name || 'Untitled conversation'}
                        </span>
                        {convTags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-0.5">
                            {convTags.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-700"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {conv.chat_messages.length} messages · {new Date(conv.updated_at).toLocaleDateString()}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          <main className="flex flex-1 flex-col overflow-hidden bg-white">
            {selected ? (
              <>
                <div className="shrink-0 space-y-2 border-b border-gray-200 px-4 py-3">
                  <div>
                    <h2 className="font-medium text-gray-900">
                      {selected.name || 'Untitled conversation'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {new Date(selected.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500">Tags:</span>
                    {selectedTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTag(selected.uuid, t)}
                          className="rounded-full p-0.5 hover:bg-blue-200"
                          aria-label={`Remove tag ${t}`}
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Add tag..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(selected.uuid, newTagInput);
                          }
                        }}
                        className="w-28 rounded border border-gray-300 px-2 py-1 text-xs placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => addTag(selected.uuid, newTagInput)}
                        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mx-auto max-w-3xl space-y-4">
                    {selected.chat_messages.length === 0 ? (
                      <p className="py-8 text-center text-gray-500">No messages in this conversation</p>
                    ) : (
                      selected.chat_messages.map((msg) => (
                        <Message
                          key={msg.uuid}
                          role={msg.sender === 'human' ? 'user' : 'assistant'}
                          content={msg.text}
                          createdAt={msg.created_at}
                        />
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-gray-500">
                Select a conversation
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
