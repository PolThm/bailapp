# Guide de Configuration Firebase pour Bailapp

Ce guide vous accompagne étape par étape pour finaliser la configuration Firebase et connecter votre backend.

## ✅ État Actuel

Votre projet a déjà:
- ✅ Configuration Firebase (`apps/web/src/config/firebaseConfig.ts`)
- ✅ Initialisation Firebase (`apps/web/src/lib/firebase.ts`)
- ✅ Authentification Google configurée dans le frontend
- ✅ Règles Firestore (`firestore.rules`)
- ✅ Fonctions Firebase (`apps/functions/src/index.ts`)
- ✅ Indexes Firestore (`firestore.indexes.json`)

## 📋 Étapes à Compléter sur Firebase Console

### Étape 1: Vérifier l'Authentification Google

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet: **bailapp-polthm**
3. Allez dans **Authentication** > **Sign-in method**
4. Vérifiez que **Google** est activé:
   - Si non activé, cliquez sur **Google**
   - Toggle **Enable**
   - Ajoutez votre email de support
   - Cliquez **Save**

### Étape 2: Vérifier/Créer Firestore Database

1. Dans Firebase Console, allez dans **Firestore Database**
2. Si la base n'existe pas:
   - Cliquez **Create database**
   - Choisissez **Start in test mode** (nous déploierons les règles après)
   - Sélectionnez une région (choisissez la plus proche de vos utilisateurs)
   - Cliquez **Enable**
3. Si elle existe déjà, vérifiez qu'elle est active

### Étape 3: Activer Firebase Functions

1. Dans Firebase Console, allez dans **Functions**
2. Si c'est la première fois:
   - Cliquez **Get started**
   - Acceptez les conditions
3. Vérifiez que vous avez un plan Blaze (pay-as-you-go) pour Functions
   - Le plan Spark (gratuit) ne supporte pas Functions
   - Mais vous avez un quota gratuit généreux

### Étape 4: Configurer les Domaines Autorisés (Important!)

Pour que l'authentification Google fonctionne:

1. Allez dans **Authentication** > **Settings** > **Authorized domains**
2. Vérifiez que ces domaines sont présents:
   - `localhost` (pour le développement)
   - `bailapp-polthm.firebaseapp.com` (votre domaine Firebase)
   - `bailapp-polthm.web.app` (votre domaine alternatif)
3. Si vous avez un domaine personnalisé, ajoutez-le aussi

### Étape 5: Déployer les Règles Firestore

Depuis votre terminal, dans le répertoire du projet:

```bash
firebase deploy --only firestore:rules
```

Cela déploie les règles de sécurité définies dans `firestore.rules`.

### Étape 6: Déployer les Indexes Firestore

```bash
firebase deploy --only firestore:indexes
```

Cela crée les index nécessaires pour les requêtes sur les chorégraphies.

### Étape 7: Déployer les Functions Firebase

```bash
cd apps/functions
bun install  # ou npm install
cd ../..
bun deploy:functions
```

Ou pour tout déployer:

```bash
bun deploy
```

## 🧪 Tester la Configuration

### Test 1: Authentification

1. Lancez l'app: `bun dev`
2. Allez sur la page Profile
3. Cliquez sur "Sign in"
4. Connectez-vous avec Google
5. Vérifiez que vous êtes bien connecté

### Test 2: Firestore (via Console)

1. Dans Firebase Console, allez dans **Firestore Database**
2. Créez manuellement une collection `users` avec un document
3. Vérifiez que vous pouvez lire/écrire

### Test 3: Functions (via Console)

1. Dans Firebase Console, allez dans **Functions**
2. Vérifiez que vos fonctions sont déployées:
   - `helloWorld`
   - `getUserProfile`
   - `updateUserProfile`
   - `saveChoreography`

## 🏗️ Architecture Backend Proposée

Pour un projet de taille moyenne comme Bailapp, voici une architecture simple et efficace:

```
apps/web/src/
├── lib/
│   ├── firebase.ts          # Initialisation Firebase (existant)
│   └── services/            # Services Firebase (à créer)
│       ├── userService.ts   # Gestion des profils utilisateur
│       ├── choreographyService.ts  # Gestion des chorégraphies
│       └── functionsService.ts     # Appels aux Functions
├── hooks/                   # Hooks React (à créer)
│   ├── useUserProfile.ts    # Hook pour le profil utilisateur
│   └── useFirestoreChoreographies.ts  # Hook pour les chorégraphies
└── context/
    └── AuthContext.tsx      # Contexte d'authentification (existant)
```

### Principe de Fonctionnement

1. **Services** (`lib/services/`): Couche d'abstraction pour Firestore et Functions
   - Encapsule la logique de communication avec Firebase
   - Gère les erreurs et transformations de données
   - Réutilisable dans toute l'application

2. **Hooks** (`hooks/`): Interface React pour les services
   - Utilise React Query pour le cache et la synchronisation
   - Fournit des états de chargement et d'erreur
   - Facilite l'utilisation dans les composants

3. **Context** (`context/`): État global partagé
   - AuthContext pour l'authentification (déjà existant)
   - Peut être étendu pour d'autres états globaux si nécessaire

## 🔄 Migration Progressive

Pour ne pas casser l'existant, nous allons:

1. **Phase 1**: Créer les services et hooks Firebase
2. **Phase 2**: Utiliser Firestore en parallèle avec IndexedDB
3. **Phase 3**: Synchroniser les données entre les deux
4. **Phase 4**: Migrer progressivement vers Firestore uniquement

## 📝 Prochaines Étapes

Une fois la configuration Firebase terminée:

1. ✅ Créer les services Firebase
2. ✅ Créer les hooks React
3. ✅ Intégrer dans les pages existantes
4. ✅ Tester la synchronisation
5. ✅ Déployer et tester en production

## 🐛 Dépannage

### Erreur: "Firebase: Error (auth/unauthorized-domain)"

**Solution**: Ajoutez votre domaine dans **Authentication** > **Settings** > **Authorized domains**

### Erreur: "Functions deployment failed"

**Solutions**:
- Vérifiez que vous avez un plan Blaze
- Vérifiez que Node.js 20 est installé: `node --version`
- Vérifiez les logs: `firebase functions:log`

### Erreur: "Permission denied" dans Firestore

**Solutions**:
- Vérifiez que les règles sont déployées: `firebase deploy --only firestore:rules`
- Vérifiez que l'utilisateur est authentifié
- Vérifiez les règles dans `firestore.rules`

### Les données ne s'affichent pas

**Solutions**:
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez Firebase Console > Firestore pour voir si les données sont créées
- Vérifiez que les règles Firestore permettent la lecture

## 📚 Ressources

- [Documentation Firebase](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Functions](https://firebase.google.com/docs/functions)
- [React Query + Firebase](https://tanstack.com/query/latest/docs/react/guides/queries)

---

**Une fois ces étapes terminées, nous pourrons créer les services et hooks pour connecter votre app au backend Firebase!** 🚀

