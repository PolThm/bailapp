# PWA Icons Configuration

## Icon Structure

This configuration uses icons generated with the theme's red color (#EF4444).

### PWA and Browser Icons

- `icon-512.png` - Large maskable PWA icon (512x512)
- `icon-192.png` - Standard PWA icon (192x192)
- `icon-144.png` - Medium PWA icon (144x144)
- `icon-96.png` - Small PWA icon (96x96)
- `icon-72.png` - Very small PWA icon (72x72)
- `icon-48.png` - Minimal PWA icon (48x48)

### Favicons

- `favicon-32x32.png` - Standard favicon (32x32)
- `favicon-16x16.png` - Small favicon (16x16)

### iOS

- `apple-touch-icon.png` - iOS icon (180x180)

### Splash Screens

- `splash-1240x600.png` - Large splash screen
- `splash-620x300.png` - Standard splash screen

### Windows

- `windows-tile-150.png` - Standard Windows tile (300x300)
- `windows-small-tile.png` - Small Windows tile (142x142)
- `windows-wide-tile.png` - Large Windows tile (620x300)
- `windows-large-tile.png` - Extra large Windows tile (620x620)

## PWA Configuration

### Manifest (`manifest.webmanifest`)

- Multiple icon sizes for Android
- Screenshots for installation
- Shortcuts to Discover and Favorites
- Theme color: #EF4444

### HTML (`index.html`)

- Multiple favicon sizes
- Apple Touch icons
- iOS splash screens
- Windows configuration (browserconfig.xml)
- Meta tags for all platforms

### Browserconfig (`browserconfig.xml`)

Specific Windows configuration with colored tiles.

## Colors Used

- **Primary theme**: #EF4444 (red)
- **Dark theme**: #DC2626 (dark red)
- **Background**: #ffffff (white)

These colors are consistent with the application's design system.
