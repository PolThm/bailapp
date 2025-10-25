# Bailapp 💃🕺

A modern PWA application for creating choreographies, learning new dance moves, and tracking your dance progress.

## Features

- 🎭 **Learn** - Browse and learn new dance moves
- 🎨 **Create** - Design and save your own choreographies
- 📊 **Progress** - Track your dance journey and improvements
- 🌍 **Multilingual** - Full support for English, French, and Spanish
- 📱 **PWA** - Install on any device and use offline
- 🔒 **Optional Auth** - Explore freely, sign in only when needed

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite 5** for fast development
- **TailwindCSS 3.4** + **Shadcn UI** for beautiful components
- **React Query 5** for data fetching
- **react-i18next 15** for internationalization
- **Firebase SDK 11** for authentication and data

### Backend
- **Firebase Functions 6** (TypeScript, Node.js 20)
- **Firestore** for database
- **Firebase Auth** (Google)
- **Firebase Hosting**

### Monorepo
- **Bun** workspaces
- Shared TypeScript and ESLint configs

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- [Firebase CLI](https://firebase.google.com/docs/cli) installed
- A Firebase project (free Spark plan)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bailapp
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up Firebase**
   
   a. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   
   b. Enable Google Authentication in Firebase Console
   
   c. Copy your Firebase config and update `apps/web/src/config/firebaseConfig.ts`:
   ```typescript
   export const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-auth-domain",
     projectId: "your-project-id",
     storageBucket: "your-storage-bucket",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```
   
   d. Update `.firebaserc` with your project ID:
   ```json
   {
     "projects": {
       "default": "your-project-id"
     }
   }
   ```

4. **Start development server**
   ```bash
   bun dev
   ```

   The app will be available at `http://localhost:5173`

### Firebase Emulators (Optional)

To develop locally with Firebase emulators:

```bash
bun emu
```

This will start:
- Firestore emulator
- Auth emulator
- Functions emulator
- Hosting emulator

## Available Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Build for production |
| `bun preview` | Preview production build |
| `bun deploy` | Deploy to Firebase (Hosting + Functions) |
| `bun deploy:hosting` | Deploy only hosting |
| `bun deploy:functions` | Deploy only functions |
| `bun emu` | Start Firebase emulators |
| `bun lint` | Lint code |
| `bun format` | Format code with Prettier |
| `bun type-check` | Check TypeScript types |

## Project Structure

```
bailapp/
├── apps/
│   ├── web/                  # Frontend React app
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   └── manifest.webmanifest
│   │   └── src/
│   │       ├── components/   # Reusable components
│   │       ├── context/      # React Context providers
│   │       ├── hooks/        # Custom hooks
│   │       ├── locales/      # Translation files
│   │       ├── pages/        # Page components
│   │       ├── config/       # Configuration files
│   │       ├── App.tsx
│   │       └── main.tsx
│   └── functions/            # Firebase Functions
│       └── src/
│           └── index.ts
├── firebase.json
├── firestore.rules
├── .firebaserc
├── package.json
└── tsconfig.base.json
```

## Internationalization

The app supports three languages:
- 🇬🇧 English (default)
- 🇫🇷 French
- 🇪🇸 Spanish

Translation files are located in `apps/web/src/locales/`.

## Authentication Flow

The app follows an "optional authentication" pattern:
- All pages are accessible without login
- Users can browse and explore freely
- Authentication is required only when trying to save data (choreographies, progress)
- A modal prompts users to sign in when needed

## Deployment

1. **Build the project**
   ```bash
   bun build
   ```

2. **Deploy to Firebase**
   ```bash
   bun deploy
   ```

Your app will be live at `https://your-project-id.web.app`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

