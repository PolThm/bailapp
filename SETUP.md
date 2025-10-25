# Bailapp Setup Guide

This guide will walk you through setting up Bailapp from scratch.

## Prerequisites

1. **Bun** - [Install Bun](https://bun.sh)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Firebase CLI** - [Install Firebase CLI](https://firebase.google.com/docs/cli)
   ```bash
   npm install -g firebase-tools
   ```

3. **Firebase Account** - Create a free account at [firebase.google.com](https://firebase.google.com)

## Step 1: Install Dependencies

From the project root:

```bash
bun install
```

This will install dependencies for all workspaces (root, web, and functions).

## Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name (e.g., "bailapp")
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## Step 3: Enable Firebase Services

### Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google**
3. Toggle to **Enable**
4. Add your support email
5. Click **Save**

### Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll deploy our security rules later)
4. Select a location (choose closest to your users)
5. Click **Enable**

### Enable Hosting

1. In Firebase Console, go to **Hosting**
2. Click **Get started**
3. Follow the wizard (we'll deploy later)

## Step 4: Configure Firebase in Your Project

### Get Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon `</>`
4. Register your app with a nickname (e.g., "Bailapp Web")
5. Copy the `firebaseConfig` object

### Update Frontend Config

Edit `apps/web/src/config/firebaseConfig.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "AIza...",           // Your actual API key
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Update Firebase Project ID

Edit `.firebaserc`:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Replace `your-project-id` with your actual Firebase project ID.

## Step 5: Login to Firebase CLI

```bash
firebase login
```

This will open a browser window for authentication.

## Step 6: Deploy Firestore Rules

Deploy your security rules:

```bash
firebase deploy --only firestore:rules
```

## Step 7: Replace PWA Icons

The icons in `apps/web/public/icons/` are SVG placeholders. Replace them with actual PNG files:

- `icon-192.png` - 192x192 pixels
- `icon-512.png` - 512x512 pixels

You can create these using:
- [Favicon Generator](https://realfavicongenerator.net/)
- Design tools like Figma, Canva, or Photoshop
- Or use the provided SVG as a starting point

## Step 8: Start Development Server

### Option A: Frontend Only (Recommended for first run)

```bash
bun dev
```

The app will be available at `http://localhost:5173`

### Option B: Full Stack with Emulators

Start Firebase emulators (Firestore, Auth, Functions, Hosting):

```bash
bun emu
```

Then in another terminal:

```bash
bun dev
```

Emulator UI will be available at `http://localhost:4000`

## Step 9: Test the Application

1. Open `http://localhost:5173` in your browser
2. Browse the app (all pages are accessible without login)
3. Try changing language (EN/FR/ES buttons in header)
4. Go to **Create** page and click **Save** button
5. You should see the auth dialog prompting you to sign in
6. Click "Sign in with Google" to authenticate

## Step 10: Build for Production

Build the frontend:

```bash
bun build
```

Build will be created in `apps/web/dist/`

## Step 11: Deploy to Firebase

### Deploy Everything

```bash
bun deploy
```

This deploys:
- Hosting (frontend)
- Functions (backend)
- Firestore rules

### Deploy Individually

```bash
# Deploy only hosting
bun deploy:hosting

# Deploy only functions
bun deploy:functions

# Deploy only firestore rules
firebase deploy --only firestore:rules
```

## Step 12: Access Your Live App

Your app will be available at:
```
https://your-project-id.web.app
```

or

```
https://your-project-id.firebaseapp.com
```

## Troubleshooting

### "Firebase config not found" error

Make sure you've updated `apps/web/src/config/firebaseConfig.ts` with your actual Firebase credentials.

### Build errors

Try clearing cache and reinstalling:
```bash
rm -rf node_modules apps/*/node_modules
bun install
```

### Functions deployment fails

Make sure you're on Node 20:
```bash
node --version  # Should be 20.x
```

### PWA not installing

- Make sure you're using HTTPS (localhost or deployed Firebase Hosting)
- Check that icons exist and are valid PNG files
- Clear browser cache and service workers

### Emulators not starting

Make sure ports are not in use:
- 4000 - Emulator UI
- 5000 - Hosting emulator
- 5001 - Functions emulator
- 8080 - Firestore emulator
- 9099 - Auth emulator

## Development Workflow

### Daily Development

```bash
# Start dev server
bun dev

# In another terminal, start emulators (optional)
bun emu
```

### Before Committing

```bash
# Lint code
bun lint

# Format code
bun format

# Type check
bun type-check
```

### Deploying Updates

```bash
# Build
bun build

# Test the build locally
bun preview

# Deploy
bun deploy
```

## Environment Variables (Optional)

For different environments, you can create:
- `.env.development`
- `.env.production`

Example:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
```

Then use in code:
```typescript
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
```

## Next Steps

Now that your app is set up:

1. **Customize the UI** - Edit components in `apps/web/src/components/`
2. **Add Dance Moves** - Populate the Learn page with actual content
3. **Build Choreography Creator** - Implement the drag & drop builder
4. **Add Progress Tracking** - Integrate with Firestore to save user progress
5. **Enhance PWA** - Add offline functionality, push notifications
6. **Add More Languages** - Extend i18n support

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Bun Documentation](https://bun.sh/docs)

## Need Help?

- Check the [README.md](./README.md) for project overview
- Review Firebase Console for errors
- Check browser console for client-side errors
- Check Firebase Functions logs: `bun run logs`

Happy dancing! 💃🕺

