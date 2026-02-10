import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { handleApiError } from '@/lib/apiErrorHandler';
import type { Settings } from '@/lib/types';

const API_KEY_PREFIX = 'sk-ant-';

export function ApiKeyForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed.startsWith(API_KEY_PREFIX)) {
      toast.error('API key must start with sk-ant-');
      return;
    }
    setSaving(true);
    try {
      await api.updateApiKey(trimmed);
      toast.success('API key saved successfully');
      setApiKey('');
      await fetchSettings();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await api.deleteApiKey();
      toast.success('API key removed');
      await fetchSettings();
    } catch (err) {
      handleApiError(err);
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse h-20 bg-gray-100 rounded-lg" />
    );
  }

  if (settings?.anthropic_key_set) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Current key: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">
            {settings.anthropic_key_preview ?? 'sk-ant-...'}
          </code>
        </p>
        <div className="flex gap-2 flex-wrap">
          <form onSubmit={handleSave} className="flex gap-2 flex-1 min-w-0">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter new key to update"
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {saving ? 'Saving...' : 'Update'}
            </button>
          </form>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {removing ? 'Removing...' : 'Remove'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Update: enter a new key and click Update. Remove: deletes the stored key.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="sk-ant-api03-..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        type="submit"
        disabled={saving || !apiKey.trim()}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
      <p className="text-xs text-gray-500">
        Your API key must start with sk-ant-
      </p>
    </form>
  );
}
