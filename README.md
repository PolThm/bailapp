# Bailapp 💃🕺

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

A modern PWA application for creating choreographies, learning new moves, and tracking your dance progress.

### **Try it now**: [bailapp.web.app](https://bailapp.web.app/)

## Features

- 📱 **Mobile-First** - Optimized for mobile with touch-friendly UI and bottom navigation
- 🎭 **Learn** - Browse and learn new dance moves
- 🎨 **Create** - Design and save your own choreographies
- 📊 **Progress** - Track your dance journey and improvements
- 🌍 **Multilingual** - Full support for English, French, Spanish and Italian
- 📲 **PWA** - Install on any device and use offline
- 🔒 **Optional Auth** - Explore freely, sign in only when needed
- ⚡ **Fast** - Code splitting, lazy loading, and optimized caching

## Tech Stack

### Frontend

- **React 19** with TypeScript (mobile-optimized)
- **Vite 5** for fast development with code splitting
- **TailwindCSS 3.4** + **Shadcn UI** for touch-friendly components
- **React Query 5** for data fetching
- **react-i18next 15** for internationalization
- **Firebase SDK 11** for authentication and data
- **Mobile-First Design** with bottom navigation and safe areas

### Backend

- **Firestore** for database
- **Firebase Auth** (Google)
- **Firebase Hosting**

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed (alternatively, you can use "yarn" or "npm")

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/PolThm/bailapp.git
   cd bailapp
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Start development server**

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
- Hosting emulator

## Available Commands

| Command              | Description               |
| -------------------- | ------------------------- |
| `bun dev`            | Start development server  |
| `bun build`          | Build for production      |
| `bun preview`        | Preview production build  |
| `bun deploy`         | Deploy to Firebase        |
| `bun deploy:hosting` | Deploy hosting            |
| `bun emu`            | Start Firebase emulators  |
| `bun lint`           | Lint code                 |
| `bun format`         | Format code with Prettier |
| `bun type-check`     | Check TypeScript types    |
| `bun ngrok`          | Start ngrok for tunneling |

## Project Structure

```
bailapp/
├── apps/
│   └── web/                  # Frontend React app
│       ├── public/
│       │   ├── icons/        # PWA icons, favicons
│       │   ├── images/       # UI images (logos, illustrations)
│       │   ├── manifest.webmanifest
│       │   └── browserconfig.xml
│       └── src/
│           ├── components/   # Reusable components
│           ├── context/      # React Context providers
│           ├── hooks/        # Custom hooks
│           ├── locales/      # Translation files
│           ├── pages/        # Page components
│           ├── config/       # Configuration files
│           ├── data/         # Video lists and other data
│           ├── App.tsx
│           └── main.tsx
├── firebase.json
├── firestore.rules
├── .firebaserc
├── package.json
└── tsconfig.base.json
```

## Internationalization

The app supports four languages:

- 🇬🇧 English (default)
- 🇫🇷 French
- 🇪🇸 Spanish
- 🇮🇹 Italian

Translation files are located in `apps/web/src/locales/`.

## Mobile-First Architecture

Bailapp is **designed mobile-first** with:

- ✅ Touch-optimized UI (44px minimum touch targets)
- ✅ Bottom navigation bar (5 main items)
- ✅ Safe area support (iPhone X+ notches)
- ✅ Responsive typography and spacing
- ✅ Performance optimized (code splitting, caching)
- ✅ PWA ready (installable, offline mode)

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

Your app will be live at `https://bailapp.web.app`

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on how to contribute to this project.

## License

MIT - see [LICENSE](LICENSE) file for details.
