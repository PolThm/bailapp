# Bailapp - Project Structure

```
bailapp/
├── apps/
│   ├── web/                          # Frontend React App
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   │   ├── icon-192.png     # PWA icon (192x192) - REPLACE WITH PNG
│   │   │   │   └── icon-512.png     # PWA icon (512x512) - REPLACE WITH PNG
│   │   │   └── manifest.webmanifest # PWA manifest
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   │   ├── button.tsx   # Shadcn Button component
│   │   │   │   │   ├── card.tsx     # Shadcn Card component
│   │   │   │   │   └── dialog.tsx   # Shadcn Dialog component
│   │   │   │   ├── AuthDialog.tsx   # Auth prompt modal
│   │   │   │   └── Layout.tsx       # App layout with navigation
│   │   │   ├── config/
│   │   │   │   └── firebaseConfig.ts # Firebase config - UPDATE THIS
│   │   │   ├── context/
│   │   │   │   └── AuthContext.tsx   # Auth context provider
│   │   │   ├── hooks/
│   │   │   │   └── useAuthPrompt.tsx # Hook for auth prompts
│   │   │   ├── lib/
│   │   │   │   ├── firebase.ts      # Firebase initialization
│   │   │   │   └── utils.ts         # Utility functions
│   │   │   ├── locales/
│   │   │   │   ├── en.json          # English translations
│   │   │   │   ├── fr.json          # French translations
│   │   │   │   └── es.json          # Spanish translations
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx         # Home page
│   │   │   │   ├── Learn.tsx        # Learn dance moves page
│   │   │   │   ├── Create.tsx       # Create choreography page
│   │   │   │   └── Progress.tsx     # Progress tracking page
│   │   │   ├── App.tsx              # Main app component
│   │   │   ├── main.tsx             # App entry point
│   │   │   ├── i18n.ts              # i18n configuration
│   │   │   ├── index.css            # Global styles (Tailwind)
│   │   │   └── vite-env.d.ts        # Vite types
│   │   ├── index.html               # HTML entry point
│   │   ├── package.json             # Frontend dependencies
│   │   ├── vite.config.ts           # Vite configuration
│   │   ├── tailwind.config.js       # Tailwind configuration
│   │   ├── postcss.config.js        # PostCSS configuration
│   │   ├── tsconfig.json            # TypeScript config
│   │   └── tsconfig.node.json       # TypeScript config for Vite
│   │
│   └── functions/                    # Firebase Functions (Backend)
│       ├── src/
│       │   └── index.ts             # Cloud functions
│       ├── package.json             # Functions dependencies
│       └── tsconfig.json            # TypeScript config
│
├── firebase.json                    # Firebase configuration
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json           # Firestore indexes
├── .firebaserc                      # Firebase project ID - UPDATE THIS
├── package.json                     # Root workspace config
├── tsconfig.base.json               # Shared TypeScript config
├── .eslintrc.json                   # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── .gitignore                       # Git ignore rules
├── README.md                        # Project documentation
├── SETUP.md                         # Detailed setup guide
├── QUICKSTART.md                    # Quick start guide
└── PROJECT_STRUCTURE.md             # This file
```

## Key Files to Update Before Starting

### 🔥 Required
1. **`apps/web/src/config/firebaseConfig.ts`** - Add your Firebase credentials
2. **`.firebaserc`** - Update with your Firebase project ID
3. **`apps/web/public/icons/icon-*.png`** - Replace SVG with actual PNG files

### ✨ Optional
- Customize colors in `apps/web/tailwind.config.js`
- Add more translations in `apps/web/src/locales/`
- Modify app name/description in `apps/web/public/manifest.webmanifest`

## Architecture Highlights

### Frontend (apps/web)
- ⚛️ **React 18** with TypeScript
- ⚡ **Vite** for fast development
- 🎨 **TailwindCSS** + **Shadcn UI** for styling
- 🌍 **react-i18next** for multilingual support (en, fr, es)
- 📱 **PWA** ready with offline support
- 🔥 **Firebase SDK** for auth and data
- 🔄 **React Query** for data fetching

### Backend (apps/functions)
- ☁️ **Firebase Functions** (TypeScript)
- 🔐 **Firebase Auth** for authentication
- 💾 **Firestore** for database
- 🛡️ Security rules configured

### Monorepo
- 📦 **Bun workspaces** for dependency management
- 🔧 Shared ESLint and TypeScript configs
- 🚀 Unified build and deploy scripts

## Authentication Strategy

**"Optional Auth" Pattern:**
- ✅ All pages accessible without login
- ✅ Users can browse and explore freely
- ✅ Auth prompt appears only when saving data
- ✅ Seamless Google sign-in experience

## Available Pages

1. **Home** (`/`) - Landing page with feature cards
2. **Learn** (`/learn`) - Browse dance moves (public)
3. **Create** (`/create`) - Create choreographies (requires auth to save)
4. **Progress** (`/progress`) - Track progress (requires auth)

## Development Workflow

```bash
# Install dependencies
bun install

# Start development
bun dev

# Start Firebase emulators
bun emu

# Build for production
bun build

# Deploy to Firebase
bun deploy

# Lint and format
bun lint
bun format
```

## Technology Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React, TypeScript, Vite, TailwindCSS, Shadcn UI |
| **State** | React Context, React Query |
| **Routing** | React Router v6 |
| **i18n** | react-i18next |
| **PWA** | vite-plugin-pwa, Workbox |
| **Backend** | Firebase Functions, Firestore, Auth |
| **Hosting** | Firebase Hosting |
| **Package Manager** | Bun |
| **Build Tool** | Vite |
| **Linting** | ESLint, Prettier |

## Next Steps

1. ✅ Install dependencies → `bun install`
2. ✅ Setup Firebase project (see [QUICKSTART.md](./QUICKSTART.md))
3. ✅ Update configuration files
4. ✅ Replace icon files with PNG
5. ✅ Start development → `bun dev`
6. ✅ Test the app locally
7. ✅ Deploy → `bun deploy`

Happy coding! 🎉

