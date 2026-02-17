# Navigator Chat App

React + Vite frontend for the Navigator Chat app. See `navigator-chat-app-spec.md` for the full spec.

## Run the app

1. Copy `.env.example` to `.env` or `.env.local` and fill in your Firebase and API URL.
2. **Backend:** The app calls a backend API at `VITE_API_URL` (default `http://localhost:8000`). You must run that backend separately. If nothing is running on that URL you’ll see “Cannot reach the API server” and connection errors in the console. **Optional:** set `VITE_MOCK_CHAT=true` in `.env` or `.env.local` to use an in-memory mock instead—no backend needed, assistant replies are random stock messages so you can exercise the full chat UI.
3. Start the frontend: `npm install` then `npm run dev`. Open the URL Vite prints (e.g. http://localhost:5173).

## Env vars

- **Firebase:** From [Firebase Console](https://console.firebase.google.com) → Project settings → Your apps → config. Enable Auth and the sign-in methods you use (Email/Password, Google).
- **VITE_API_URL:** Base URL of the Navigator backend (e.g. `http://localhost:8000`). This is not the Vite dev server URL. If you run your own backend, enable CORS for your frontend origin (e.g. `http://localhost:5173`).

## Backend

The frontend expects an API server at `VITE_API_URL`. To build and run it locally on port 8000, use **[BACKEND-SPEC.md](./BACKEND-SPEC.md)**. It defines endpoints, auth (Firebase token verification), data model, and how to wire Anthropic + optional Navigator SDK. Implement the backend in a separate directory (e.g. `backend/`) or repo, then run it with `PORT=8000` and point the frontend’s `VITE_API_URL` at it.

## Deploy to Netlify

### Option 1: Deploy via Netlify UI (recommended)

1. Push this repo to GitHub, GitLab, or Bitbucket.
2. Log in to [Netlify](https://app.netlify.com) and click **Add new site** → **Import an existing project**.
3. Connect your Git provider and select this repository.
4. Netlify will auto-detect the build settings from `netlify.toml`. Verify:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Under **Site configuration** → **Environment variables**, add:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_API_URL` — your deployed backend URL (e.g. `https://your-api.example.com`). For mock mode, add `VITE_MOCK_CHAT=true` instead.
6. Click **Deploy site**.

### Option 2: Deploy via Netlify CLI

1. Install the CLI: `npm install -g netlify-cli`
2. Build locally: `npm run build`
3. Deploy: `netlify deploy --prod` (or `netlify deploy` for a preview)
4. Set env vars in the Netlify dashboard or via `netlify env:set` before deploying.

### SPA routing

The `netlify.toml` includes a redirect so client-side routes (e.g. `/chat/123`) work correctly. All non-file requests are served `index.html`.