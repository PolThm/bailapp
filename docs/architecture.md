# Architecture Overview of Bailapp

## Project Structure

The Bailapp project is organized into a monorepo structure, utilizing Bun workspaces for better management of multiple applications and shared resources. Below is a detailed overview of the key folders and their responsibilities:

### 1. `apps/web`

This folder contains the main web application for Bailapp, which is a Progressive Web App (PWA) designed for creating choreographies and learning dance moves. The structure within this directory is as follows:

- **`src`**: The source code for the web application.
  - **`components`**: Contains reusable UI components such as `FigureCard`, `ChoreographyMovementItem`, and `AdvancedFiltersModal`. These components are designed to be modular and reusable across different parts of the application.
  - **`hooks`**: Custom React hooks, such as `useFigures`, which provide context management and stateful logic for figures used in dance choreographies.
  - **`lib`**: Contains utility libraries and integrations, such as `firebase.ts`, which initializes Firebase services including authentication and Firestore database.
  - **`data`**: Stores static data files, such as video lists and movement lists, which are used throughout the application.
  - **`locales`**: Contains translation files to support multiple languages (English, French, Spanish, and Italian).

### 2. `lib`

This folder is primarily used for utility functions and external service integrations. For example, the `firebase.ts` file initializes Firebase services:

```typescript
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/config/firebaseConfig';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Auth providers
export const googleProvider = new GoogleAuthProvider();
```

### 3. `hooks`

The hooks directory contains custom hooks that encapsulate reusable logic. For example, the `useFigures` hook provides access to the figures context:

```typescript
import { createContext, useContext } from 'react';
import type { Figure, DanceStyle } from '@/types';

export interface FiguresContextType {
  figures: Figure[];
  shorts: Figure[];
  getFigure: (id: string) => Figure | undefined;
  getFiguresByCategory: (category: DanceStyle) => Figure[];
  addFigure: (figure: Figure) => void;
  updateFigure: (id: string, updates: Partial<Figure>) => void;
}

export const FiguresContext = createContext<FiguresContextType | undefined>(undefined);

export function useFigures() {
  const context = useContext(FiguresContext);
  if (context === undefined) {
    throw new Error('useFigures must be used within a FiguresProvider');
  }
  return context;
}
```

### 4. `components`

The components directory holds the UI components that are used throughout the application. Each component is designed to be reusable and follows a consistent styling approach. For example, the `AdvancedFiltersModal` component allows users to filter figures based on various criteria, including video language:

```typescript
const videoLanguages: VideoLanguage[] = ['french', 'english', 'spanish', 'italian'];
```

## Design Decisions

### TypeScript Configuration

The project utilizes TypeScript with strict settings to ensure type safety and code quality. The configuration is defined in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Package Management

The project uses Bun as the package manager, as indicated in the `package.json` file. It includes scripts for development, building, and deploying the application:

```json
"scripts": {
  "dev": "bun --cwd apps/web dev",
  "build": "bun --cwd apps/web build",
  "preview": "bun --cwd apps/web preview",
  "deploy": "firebase deploy",
  "lint": "eslint .",
  "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
}
```

## Usage Examples

### Running the Application

To start the development server, run the following command:

```bash
bun --cwd apps/web dev
```

### Deploying the Application

To deploy the application to Firebase hosting, use:

```bash
firebase deploy --only hosting
```

### Adding a Video

To add a new video to the application, navigate to the appropriate data file and add the video entry:

```typescript
{
  id: 'watch_ABC123xyz',
  youtubeUrl: 'https://www.youtube.com/watch?v=ABC123xyz',
  videoLanguage: 'english',
  visibility: 'public',
  importedBy: 'Bailapp',
  createdAt: '2025-12-08T01:00:00.000Z',
}
```

## Conclusion

This architecture overview provides a comprehensive look at the structure and design decisions of the Bailapp project. The organization into distinct folders helps maintain clarity and modularity, allowing for easier development and maintenance.
