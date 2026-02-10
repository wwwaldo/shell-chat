import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold text-gray-900">Page not found</h1>
      <p className="text-gray-600">The page you’re looking for doesn’t exist.</p>
      <Link
        to="/"
        className="text-gray-900 underline decoration-gray-400 underline-offset-2 hover:decoration-gray-600"
      >
        Go to home
      </Link>
    </div>
  );
}
