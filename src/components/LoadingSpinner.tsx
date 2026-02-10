export function LoadingSpinner() {
  return (
    <div
      className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600"
      role="status"
      aria-label="Loading"
    />
  );
}
