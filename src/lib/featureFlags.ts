/**
 * Feature flags for gating in-progress or staged features.
 * Set via VITE_FEATURE_* env vars in .env or .env.local.
 */

export const featureFlags = {
  /** JSON Chat Viewer: bulk upload conversations to backend DB. */
  bulkUpload: import.meta.env.VITE_FEATURE_BULK_UPLOAD === 'true',
} as const;
