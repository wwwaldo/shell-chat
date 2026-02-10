import toast from 'react-hot-toast';
import { ApiError } from './types';

/**
 * Handles API errors by showing appropriate toasts and/or triggering redirects.
 * Use this when calling api methods from any component (Settings, Chat, etc.).
 * Agent 3 can use this same pattern for 403/404 in the chat flow.
 *
 * Returns true if the error was handled, false otherwise (caller can handle).
 */
export function handleApiError(
  error: unknown,
  options?: {
    on401?: () => void;
    on403?: () => void;
  }
): boolean {
  const on401 = options?.on401 ?? (() => window.location.replace('/login'));
  const on403 = options?.on403 ?? (() => window.location.replace('/'));

  if (error instanceof ApiError) {
    switch (error.code) {
      case 'invalid_token':
        on401();
        return true;
      case 'forbidden':
        toast.error("You don't have access to this conversation");
        on403();
        return true;
      case 'rate_limited':
        toast.error('Please wait a moment');
        return true;
      default:
        toast.error(error.message || 'Something went wrong');
        return true;
    }
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    toast.error('Network error. Please check your connection and try again.');
    return true;
  }

  if (error instanceof Error) {
    toast.error(error.message || 'Something went wrong');
    return true;
  }

  return false;
}
