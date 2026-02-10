import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { ApiKeyForm } from '@/components/ApiKeyForm';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">API Key</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <ApiKeyForm />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Account</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <p className="text-gray-700">
              <span className="font-medium">Email:</span> {user?.email ?? '—'}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
