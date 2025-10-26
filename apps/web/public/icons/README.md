# PWA Icons Configuration

## Structure des icônes

Cette configuration utilise les icônes générées avec la couleur rouge du thème (#EF4444).

### Icônes principales (copiées dans /icons/)
- `icon-192.png` - Icône PWA standard (192x192)
- `icon-512.png` - Icône PWA large et maskable (512x512)
- `apple-touch-icon.png` - Icône iOS (180x180)
- `favicon-32x32.png` - Favicon standard (32x32)
- `favicon-16x16.png` - Favicon petit (16x16)
- `splash-1240x600.png` - Splash screen large
- `splash-620x300.png` - Splash screen standard

### Icônes par plateforme (dans AppImages/)

#### Android (`/AppImages/android/`)
- `android-launchericon-512-512.png` - Icône principale
- `android-launchericon-192-192.png` - Icône standard
- `android-launchericon-144-144.png` - Icône moyenne
- `android-launchericon-96-96.png` - Icône petite
- `android-launchericon-72-72.png` - Icône très petite
- `android-launchericon-48-48.png` - Icône minimale

#### iOS (`/AppImages/ios/`)
Icônes de 16x16 à 1024x1024 pour toutes les tailles iOS requises.

#### Windows 11 (`/AppImages/windows11/`)
- Tuiles de différentes tailles (SmallTile, Square150x150Logo, etc.)
- Logos pour différents contextes
- Splash screens pour Windows

## Configuration PWA

### Manifest (`manifest.webmanifest`)
- Icônes multiples tailles pour Android
- Screenshots pour l'installation
- Raccourcis vers Discover et Favorites
- Couleur de thème : #EF4444

### HTML (`index.html`)
- Favicons multiples tailles
- Icônes Apple Touch
- Splash screens iOS
- Configuration Windows (browserconfig.xml)
- Méta-tags pour toutes les plateformes

### Browserconfig (`browserconfig.xml`)
Configuration spécifique pour Windows avec tuiles colorées.

## Couleurs utilisées

- **Thème principal** : #EF4444 (rouge)
- **Thème sombre** : #DC2626 (rouge foncé)
- **Arrière-plan** : #ffffff (blanc)

Ces couleurs sont cohérentes avec le design system de l'application.