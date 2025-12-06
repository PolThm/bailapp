import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Plugin to watch .env.public and restart server on changes
function envPublicPlugin() {
  const envPublicPath = path.resolve(__dirname, '../../.env.public');

  return {
    name: 'env-public-watcher',
    configureServer(server) {
      // Watch .env.public file
      server.watcher.add(envPublicPath);

      server.watcher.on('change', (file) => {
        if (file === envPublicPath) {
          console.log('\n.env.public changed, restarting server...\n');
          server.restart();
        }
      });
    },
  };
}

export default defineConfig(() => {
  // Read .env.public file manually from root directory
  const envPublicPath = path.resolve(__dirname, '../../.env.public');
  let appVersion = '0.4.0';

  try {
    const envContent = fs.readFileSync(envPublicPath, 'utf-8');
    const match = envContent.match(/VITE_PUBLIC_APP_VERSION=(.+)/);
    if (match) {
      appVersion = match[1].trim();
    }
  } catch (error) {
    console.warn('Could not read .env.public file:', error);
  }

  return {
    // Define global constants from .env.public
    define: {
      'import.meta.env.VITE_PUBLIC_APP_VERSION': JSON.stringify(appVersion),
    },
    plugins: [
      envPublicPlugin(),
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: [
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/apple-touch-icon.png',
          'icons/favicon-32x32.png',
          'icons/favicon-16x16.png',
        ],
        manifest: {
          name: 'Bailapp',
          short_name: 'Bailapp',
          description: 'Create choreographies, learn dance moves, track progress',
          theme_color: '#EF4444',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          categories: ['entertainment', 'lifestyle', 'education'],
          prefer_related_applications: false,
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // Mobile-optimized caching strategy
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'firebase-storage-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.firebaseapp\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firebase-api-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // 1 day
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true, // Enable PWA in dev for testing
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0', // Allow external connections (required for ngrok)
      strictPort: false,
      allowedHosts: ['.ngrok-free.dev', '.ngrok.io', '.ngrok.app'], // Allow ngrok hosts
      hmr: {
        clientPort: 5173,
      },
    },
    build: {
      // Mobile-first build optimizations
      target: 'es2020',
      cssCodeSplit: true,
      minify: 'terser' as const,
      terserOptions: {
        compress: {
          drop_console: true, // Remove console logs in production
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching on mobile
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  };
});
