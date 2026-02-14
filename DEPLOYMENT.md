# Shell Chat Frontend Deployment Guide

This guide covers deploying the Shell Chat frontend to Firebase Hosting.

## Prerequisites

- Backend deployed and Cloud Run URL known (e.g. `https://shell-chat-backend-xxxxx-uc.a.run.app`)
- Firebase project (same as backend, e.g. `shell-chat-3b8d2`)

---

## Option 1: Firebase Hosting (Recommended)

Deploy the React frontend to Firebase Hosting. The frontend uses the same Firebase project as the backend.

### 0. Install Firebase CLI

```bash
npm install -g firebase-tools
```

If you get "command not found" after installing, your npm global bin may not be in `PATH`. Use `npx` instead:

```bash
npx firebase-tools login
npx firebase-tools init hosting
npx firebase-tools deploy
```

### 1. Initialize Firebase Hosting

From this directory:

```bash
firebase login
firebase init hosting
```

- Choose **Use an existing project** → select your Firebase project (e.g. `shell-chat-3b8d2`)
- **Public directory:** `dist`
- **Single-page app:** Yes
- Don't overwrite `index.html` if asked

### 2. Build with production API URL

Vite injects `VITE_API_URL` at build time. Set it to your Cloud Run backend URL:

```bash
VITE_API_URL=https://shell-chat-backend-219868201738.us-central1.run.app npm run build
```

Replace the URL with your actual Cloud Run service URL.

### 3. Deploy

```bash
firebase deploy
```

The app will be live at `https://<project-id>.web.app` and `https://<project-id>.firebaseapp.com`.

### CORS

The backend must allow your frontend origin. Add these to `allow_origins` in the backend's `main.py`:

- `https://<project-id>.web.app`
- `https://<project-id>.firebaseapp.com`
