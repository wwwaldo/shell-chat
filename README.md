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