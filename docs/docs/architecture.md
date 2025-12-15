---
title: 'Architecture Overview'
description: 'A comprehensive overview of the Bailapp architecture, including folder structure, key components, hooks, services, and contexts.'
icon: '🏗️'
order: 1
---

# Architecture Overview of Bailapp

## Project Structure

The Bailapp project is organized into a monorepo structure, utilizing Bun workspaces for effective management of multiple applications and shared resources. Currently, it includes a web Progressive Web App (PWA) designed for creating choreographies and learning dance moves. Below is a detailed overview of the key folders and their responsibilities:

### 1. `apps/web`

This folder contains the main web application for Bailapp. The structure within this directory is as follows:

- **`src`**: The source code for the web application.
  - **`pages`**: Contains React page components for:
    - `Choreographies`: Listing, creating, following/unfollowing choreographies.
    - `ChoreographyDetail`: Viewing and editing a single choreography with drag-and-drop movements.
    - `Discover`: Browsing and filtering public “figures” (dance moves) and shorts.
  - **`components`**: Reusable UI components such as `ChoreographyCard`, `Loader`, and `Toast`.
  - **`hooks`**: Custom React hooks, such as `useAuth` and `useChoreographies`, which provide context management and stateful logic.
  - **`lib`**: Contains utility libraries and integrations, such as Firebase services.
  - **`data`**: Stores static data files used throughout the application.
  - **`locales`**: Contains translation files to support multiple languages.

### 2. `lib`

This folder is primarily used for utility functions and external service integrations. For example, the `firebase.ts` file initializes Firebase services, including authentication and Firestore database.

### 3. `hooks`

The hooks directory contains custom hooks that encapsulate reusable logic. For example, the `useFigures` hook provides access to the figures context.

### 4. `components`

The components directory holds the UI components that are used throughout the application. Each component is designed to be reusable and follows a consistent styling approach.

## Key Components and Hooks

### React Contexts and Hooks

- **`useAuth`**: Provides authentication state.

  ```typescript
  useAuth(): { user: User | null }
  ```

- **`useChoreographies`**: Manages choreographies with CRUD operations.

  ```typescript
  useChoreographies(): {
    choreographies: Choreography[];
    followedChoreographies: Choreography[];
    isLoading: boolean;
    getChoreography(id: string): Choreography | undefined;
    deleteChoreography(id: string): Promise<void>;
    updateChoreography(choreo: Choreography): Promise<void>;
    togglePublic(id: string): Promise<void>;
    copyChoreography(id: string): Promise<void>;
    followChoreography(id: string, ownerId: string): Promise<void>;
    unfollowChoreography(id: string, ownerId: string): Promise<void>;
    updateSharingMode(id: string, mode: 'private'|'public'): Promise<void>;
  }
  ```

- **`useFigures`**: Manages figures and shorts.

  ```typescript
  useFigures(): {
    figures: Figure[];
    shorts: Figure[];
    addFigure(data: NewFigureFormData): Promise<void>;
  }
  ```

- **`useFigureFilters`**: Provides filtering capabilities for figures.
  ```typescript
  useFigureFilters(items: Figure[]): {
    selectedStyle: string;
    setSelectedStyle(style: string): void;
    searchQuery: string;
    setSearchQuery(q: string): void;
    advancedFilters: Record<string, any>;
    setAdvancedFilters(f: Record<string, any>): void;
    filteredFigures: Figure[];
    hasActiveFilters: boolean;
    clearFilters(): void;
  }
  ```

### Services

The following services are available for data fetching:

- **`getPublicChoreography(choreographyId: string): Promise<Choreography>`**
- **`getChoreographyByIdAndOwner(choreographyId: string, ownerId: string): Promise<Choreography>`**
- **`getUserProfileFromFirestore(uid: string): Promise<UserProfile>`**

## Design Decisions

### TypeScript Configuration

The project utilizes TypeScript with strict settings to ensure type safety and code quality.

### Package Management

The project uses Bun as the package manager, as indicated in the `package.json` file. It includes scripts for development, building, and deploying the application.

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
