# Architecture Firebase pour Bailapp

## 📁 Structure des Fichiers

```
apps/web/src/
├── lib/
│   ├── firebase.ts                    # Initialisation Firebase (Auth, Firestore, Functions)
│   └── services/                      # Services Firebase (couche d'abstraction)
│       ├── userService.ts             # Gestion des profils utilisateur (Firestore)
│       ├── choreographyService.ts     # Gestion des chorégraphies (Firestore)
│       └── functionsService.ts        # Appels aux Functions Firebase
├── hooks/
│   ├── useUserProfile.ts              # Hook pour le profil utilisateur
│   └── useFirestoreChoreographies.ts   # Hook pour les chorégraphies
└── context/
    └── AuthContext.tsx                # Contexte d'authentification (amélioré)
```

## 🏗️ Architecture en Couches

### 1. **Services** (`lib/services/`)

Couche d'abstraction qui encapsule toute la logique de communication avec Firebase.

**Avantages:**
- ✅ Réutilisable dans toute l'application
- ✅ Facile à tester
- ✅ Gestion centralisée des erreurs
- ✅ Transformation des données (Firestore ↔ App)

**Services disponibles:**

- **`userService.ts`**: Gestion des profils utilisateur dans Firestore
  - `getUserProfileFromFirestore(userId)`
  - `saveUserProfileToFirestore(user, data)`
  - `createUserProfileOnSignIn(user)`

- **`choreographyService.ts`**: Gestion des chorégraphies dans Firestore
  - `getUserChoreographies(userId)`
  - `getChoreography(id)`
  - `createChoreography(choreography, userId)`
  - `updateChoreography(id, updates, userId)`
  - `deleteChoreography(id)`
  - `updateChoreographyLastOpened(id)`

- **`functionsService.ts`**: Appels aux Functions Firebase
  - `getUserProfile()` - Via Functions
  - `updateUserProfile(data)` - Via Functions
  - `saveChoreography(data)` - Via Functions

### 2. **Hooks React** (`hooks/`)

Interface React pour utiliser les services avec React Query.

**Avantages:**
- ✅ Cache automatique
- ✅ Synchronisation en temps réel
- ✅ États de chargement et d'erreur
- ✅ Invalidation automatique du cache

**Hooks disponibles:**

- **`useUserProfile()`**: Gestion du profil utilisateur
  ```typescript
  const { profile, isLoading, updateProfile } = useUserProfile();
  ```

- **`useFirestoreChoreographies()`**: Gestion des chorégraphies
  ```typescript
  const { 
    choreographies, 
    isLoading, 
    createChoreography, 
    updateChoreography,
    deleteChoreography 
  } = useFirestoreChoreographies();
  ```

- **`useFirestoreChoreography(id)`**: Une chorégraphie spécifique
  ```typescript
  const { choreography, isLoading, markAsOpened } = useFirestoreChoreography(id);
  ```

### 3. **Context** (`context/`)

État global partagé pour l'authentification.

- **`AuthContext.tsx`**: 
  - Gère l'état d'authentification
  - Crée automatiquement le profil utilisateur au premier sign-in
  - Fournit `user`, `loading`, `signInWithGoogle()`, `logout()`

## 🔄 Flux de Données

### Authentification

```
User clicks "Sign in" 
  → AuthContext.signInWithGoogle()
  → Firebase Auth (Google)
  → onAuthStateChanged triggered
  → createUserProfileOnSignIn() (automatique)
  → Firestore: users/{userId} créé
```

### Lecture des Chorégraphies

```
Component uses useFirestoreChoreographies()
  → React Query checks cache
  → If stale/missing: calls getUserChoreographies()
  → Service queries Firestore
  → Data transformed and cached
  → Component re-renders with data
```

### Création d'une Chorégraphie

```
User creates choreography
  → Component calls createChoreography()
  → Hook mutation calls createChoreography() service
  → Service saves to Firestore
  → React Query invalidates cache
  → Component refetches automatically
```

## 📊 Collections Firestore

### `users/{userId}`

Structure:
```typescript
{
  displayName: string;
  email: string;
  bio?: string;
  favoriteStyles?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Règles:
- ✅ Lecture: Public
- ✅ Écriture: Propriétaire uniquement

### `choreographies/{choreographyId}`

Structure:
```typescript
{
  userId: string;
  name: string;
  danceStyle: string;
  danceSubStyle?: string;
  complexity?: string;
  phrasesCount?: number;
  movements: ChoreographyMovement[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastOpenedAt?: Timestamp;
}
```

Règles:
- ✅ Lecture: Public
- ✅ Création: Utilisateurs authentifiés (vérifie userId)
- ✅ Modification/Suppression: Propriétaire uniquement

## 🔧 Functions Firebase

### `getUserProfile`

Récupère le profil utilisateur (alternative à Firestore direct).

**Usage:**
```typescript
import { getUserProfile } from '@/lib/services/functionsService';

const profile = await getUserProfile();
```

### `updateUserProfile`

Met à jour le profil utilisateur via Functions.

**Usage:**
```typescript
import { updateUserProfile } from '@/lib/services/functionsService';

await updateUserProfile({
  displayName: 'John Doe',
  bio: 'Dancer',
});
```

### `saveChoreography`

Sauvegarde une chorégraphie via Functions (alternative à Firestore direct).

**Usage:**
```typescript
import { saveChoreography } from '@/lib/services/functionsService';

await saveChoreography({
  title: 'My Choreography',
  description: 'Description',
  moves: [...],
});
```

## 💡 Exemples d'Utilisation

### Exemple 1: Afficher le profil utilisateur

```typescript
import { useUserProfile } from '@/hooks/useUserProfile';

function ProfilePage() {
  const { profile, isLoading, updateProfile } = useUserProfile();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{profile?.displayName}</h1>
      <p>{profile?.bio}</p>
      <button onClick={() => updateProfile({ bio: 'New bio' })}>
        Update Bio
      </button>
    </div>
  );
}
```

### Exemple 2: Lister les chorégraphies

```typescript
import { useFirestoreChoreographies } from '@/hooks/useFirestoreChoreographies';

function ChoreographiesPage() {
  const { 
    choreographies, 
    isLoading, 
    createChoreography,
    deleteChoreography 
  } = useFirestoreChoreographies();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {choreographies.map(choreo => (
        <div key={choreo.id}>
          <h2>{choreo.name}</h2>
          <button onClick={() => deleteChoreography(choreo.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Exemple 3: Créer une chorégraphie

```typescript
import { useFirestoreChoreographies } from '@/hooks/useFirestoreChoreographies';

function CreateChoreography() {
  const { createChoreography, isCreating } = useFirestoreChoreographies();

  const handleSubmit = async () => {
    await createChoreography({
      name: 'My New Choreography',
      danceStyle: 'salsa',
      movements: [],
    });
  };

  return (
    <button onClick={handleSubmit} disabled={isCreating}>
      {isCreating ? 'Creating...' : 'Create'}
    </button>
  );
}
```

## 🔄 Migration Progressive

Pour ne pas casser l'existant, vous pouvez:

1. **Utiliser Firestore en parallèle avec IndexedDB**
   - Les données locales restent disponibles
   - Les nouvelles données vont dans Firestore
   - Synchronisation progressive

2. **Migrer progressivement**
   - Commencer par les nouvelles fonctionnalités
   - Migrer les données existantes petit à petit
   - Garder IndexedDB comme fallback

3. **Mode hybride**
   - Firestore pour la synchronisation cloud
   - IndexedDB pour le cache local et offline

## 🚀 Prochaines Étapes

1. ✅ Services créés
2. ✅ Hooks créés
3. ✅ AuthContext amélioré
4. ⏳ Intégrer dans les pages existantes
5. ⏳ Tester la synchronisation
6. ⏳ Déployer et tester en production

## 📚 Ressources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Functions](https://firebase.google.com/docs/functions)
- [React Query](https://tanstack.com/query/latest)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

