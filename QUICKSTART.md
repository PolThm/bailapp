# Bailapp - Quick Start Guide 🚀

Get Bailapp running in 5 minutes!

## 1. Install Dependencies

```bash
bun install
```

## 2. Setup Firebase

### Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Google Authentication**
4. Enable **Firestore Database**

### Get Your Config
1. Go to Project Settings
2. Add a Web App
3. Copy the `firebaseConfig` object

### Update Config Files

**File: `apps/web/src/config/firebaseConfig.ts`**
```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**File: `.firebaserc`**
```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

## 3. Login to Firebase

```bash
firebase login
```

## 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## 5. Replace Icons

The icons in `apps/web/public/icons/` are SVG files. Replace them with PNG:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

Use [favicon.io](https://favicon.io) to generate them quickly.

## 6. Start Development

```bash
bun dev
```

Open [localhost:5173](http://localhost:5173)

## 7. Deploy to Production

```bash
bun build
bun deploy
```

Your app will be live at `https://YOUR_PROJECT_ID.web.app`

## 🎉 That's it!

For detailed setup, see [SETUP.md](./SETUP.md)

## Key Features to Try

- ✅ Browse all pages without login
- ✅ Change language (EN/FR/ES)
- ✅ Try to save a choreography → Auth prompt appears
- ✅ Sign in with Google
- ✅ Install as PWA (on mobile or Chrome)

## Common Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Build for production |
| `bun deploy` | Deploy to Firebase |
| `bun emu` | Start Firebase emulators |
| `bun lint` | Lint code |

## Need Help?

- 📖 Read [SETUP.md](./SETUP.md) for detailed instructions
- 🔥 Check [Firebase Console](https://console.firebase.google.com)
- 🐛 Check browser console for errors

Happy dancing! 💃🕺

