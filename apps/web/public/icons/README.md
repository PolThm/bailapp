# PWA Icons Configuration

## Structure des icônes

Cette configuration utilise les icônes générées avec la couleur rouge du thème (#EF4444).

### Icônes PWA et navigateurs
- `icon-512.png` - Icône PWA large et maskable (512x512)
- `icon-192.png` - Icône PWA standard (192x192)
- `icon-144.png` - Icône PWA moyenne (144x144)
- `icon-96.png` - Icône PWA petite (96x96)
- `icon-72.png` - Icône PWA très petite (72x72)
- `icon-48.png` - Icône PWA minimale (48x48)

### Favicons
- `favicon-32x32.png` - Favicon standard (32x32)
- `favicon-16x16.png` - Favicon petit (16x16)

### iOS
- `apple-touch-icon.png` - Icône iOS (180x180)

### Splash screens
- `splash-1240x600.png` - Splash screen large
- `splash-620x300.png` - Splash screen standard

### Windows
- `windows-tile-150.png` - Tuile Windows standard (300x300)
- `windows-small-tile.png` - Petite tuile Windows (142x142)
- `windows-wide-tile.png` - Tuile Windows large (620x300)
- `windows-large-tile.png` - Grande tuile Windows (620x620)

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