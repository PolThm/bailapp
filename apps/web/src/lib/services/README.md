# Services Firebase

Cette directory contient les services pour interagir avec Firebase (Firestore et Functions).

## Structure

- **`userService.ts`**: Gestion des profils utilisateur dans Firestore
- **`choreographyService.ts`**: Gestion des chorégraphies dans Firestore  
- **`functionsService.ts`**: Appels aux Functions Firebase

## Utilisation

Ces services sont utilisés via les hooks React dans `hooks/`:

- `useUserProfile()` utilise `userService.ts`
- `useFirestoreChoreographies()` utilise `choreographyService.ts`
- Les Functions peuvent être appelées directement via `functionsService.ts`

## Principes

1. **Abstraction**: Les services encapsulent la logique Firebase
2. **Transformation**: Conversion entre types Firestore et types de l'app
3. **Gestion d'erreurs**: Toutes les erreurs sont catchées et loggées
4. **Réutilisabilité**: Utilisables partout dans l'application

