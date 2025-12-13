// vite.config.ts
import fs from "fs";
import path from "path";
import react from "file:///Users/polthomas/Documents/Git/bailapp/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig } from "file:///Users/polthomas/Documents/Git/bailapp/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///Users/polthomas/Documents/Git/bailapp/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "/Users/polthomas/Documents/Git/bailapp/apps/web";
function envPublicPlugin() {
  const envPublicPath = path.resolve(__vite_injected_original_dirname, "../../.env.public");
  return {
    name: "env-public-watcher",
    configureServer(server) {
      server.watcher.add(envPublicPath);
      server.watcher.on("change", (file) => {
        if (file === envPublicPath) {
          console.log("\n.env.public changed, restarting server...\n");
          server.restart();
        }
      });
    }
  };
}
var vite_config_default = defineConfig(() => {
  const envPublicPath = path.resolve(__vite_injected_original_dirname, "../../.env.public");
  let appVersion = "0.5.0";
  try {
    const envContent = fs.readFileSync(envPublicPath, "utf-8");
    const match = envContent.match(/VITE_PUBLIC_APP_VERSION=(.+)/);
    if (match) {
      appVersion = match[1].trim();
    }
  } catch (error) {
    console.warn("Could not read .env.public file:", error);
  }
  return {
    // Define global constants from .env.public
    define: {
      "import.meta.env.VITE_PUBLIC_APP_VERSION": JSON.stringify(appVersion)
    },
    plugins: [
      envPublicPlugin(),
      react(),
      VitePWA({
        registerType: "prompt",
        includeAssets: [
          "icons/icon-192.png",
          "icons/icon-512.png",
          "icons/apple-touch-icon.png",
          "icons/favicon-32x32.png",
          "icons/favicon-16x16.png"
        ],
        manifest: {
          name: "Bailapp",
          short_name: "Bailapp",
          description: "Create choreographies, learn dance moves, track progress",
          theme_color: "#EF4444",
          background_color: "#ffffff",
          display: "standalone",
          scope: "/",
          start_url: "/",
          categories: ["entertainment", "lifestyle", "education"],
          prefer_related_applications: false,
          icons: [
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        },
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          // Mobile-optimized caching strategy
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "firebase-storage-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                  // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/.*\.firebaseapp\.com\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "firebase-api-cache",
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24
                  // 1 day
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true
          // Enable PWA in dev for testing
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      port: 5173,
      host: "0.0.0.0",
      // Allow external connections (required for ngrok)
      strictPort: false,
      allowedHosts: [".ngrok-free.dev", ".ngrok.io", ".ngrok.app"],
      // Allow ngrok hosts
      hmr: {
        clientPort: 5173
      }
    },
    build: {
      // Mobile-first build optimizations
      target: "es2020",
      cssCodeSplit: true,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          // Remove console logs in production
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching on mobile
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "firebase-vendor": ["firebase/app", "firebase/auth", "firebase/firestore"],
            "ui-vendor": ["lucide-react", "clsx", "tailwind-merge"]
          }
        }
      },
      chunkSizeWarningLimit: 1e3
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcG9sdGhvbWFzL0RvY3VtZW50cy9HaXQvYmFpbGFwcC9hcHBzL3dlYlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3BvbHRob21hcy9Eb2N1bWVudHMvR2l0L2JhaWxhcHAvYXBwcy93ZWIvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3BvbHRob21hcy9Eb2N1bWVudHMvR2l0L2JhaWxhcHAvYXBwcy93ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcblxuLy8gUGx1Z2luIHRvIHdhdGNoIC5lbnYucHVibGljIGFuZCByZXN0YXJ0IHNlcnZlciBvbiBjaGFuZ2VzXG5mdW5jdGlvbiBlbnZQdWJsaWNQbHVnaW4oKSB7XG4gIGNvbnN0IGVudlB1YmxpY1BhdGggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vLmVudi5wdWJsaWMnKTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdlbnYtcHVibGljLXdhdGNoZXInLFxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIC8vIFdhdGNoIC5lbnYucHVibGljIGZpbGVcbiAgICAgIHNlcnZlci53YXRjaGVyLmFkZChlbnZQdWJsaWNQYXRoKTtcblxuICAgICAgc2VydmVyLndhdGNoZXIub24oJ2NoYW5nZScsIChmaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlID09PSBlbnZQdWJsaWNQYXRoKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1xcbi5lbnYucHVibGljIGNoYW5nZWQsIHJlc3RhcnRpbmcgc2VydmVyLi4uXFxuJyk7XG4gICAgICAgICAgc2VydmVyLnJlc3RhcnQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCgpID0+IHtcbiAgLy8gUmVhZCAuZW52LnB1YmxpYyBmaWxlIG1hbnVhbGx5IGZyb20gcm9vdCBkaXJlY3RvcnlcbiAgY29uc3QgZW52UHVibGljUGF0aCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi8uZW52LnB1YmxpYycpO1xuICBsZXQgYXBwVmVyc2lvbiA9ICcwLjUuMCc7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBlbnZDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGVudlB1YmxpY1BhdGgsICd1dGYtOCcpO1xuICAgIGNvbnN0IG1hdGNoID0gZW52Q29udGVudC5tYXRjaCgvVklURV9QVUJMSUNfQVBQX1ZFUlNJT049KC4rKS8pO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgYXBwVmVyc2lvbiA9IG1hdGNoWzFdLnRyaW0oKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS53YXJuKCdDb3VsZCBub3QgcmVhZCAuZW52LnB1YmxpYyBmaWxlOicsIGVycm9yKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLy8gRGVmaW5lIGdsb2JhbCBjb25zdGFudHMgZnJvbSAuZW52LnB1YmxpY1xuICAgIGRlZmluZToge1xuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX1BVQkxJQ19BUFBfVkVSU0lPTic6IEpTT04uc3RyaW5naWZ5KGFwcFZlcnNpb24pLFxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgZW52UHVibGljUGx1Z2luKCksXG4gICAgICByZWFjdCgpLFxuICAgICAgVml0ZVBXQSh7XG4gICAgICAgIHJlZ2lzdGVyVHlwZTogJ3Byb21wdCcsXG4gICAgICAgIGluY2x1ZGVBc3NldHM6IFtcbiAgICAgICAgICAnaWNvbnMvaWNvbi0xOTIucG5nJyxcbiAgICAgICAgICAnaWNvbnMvaWNvbi01MTIucG5nJyxcbiAgICAgICAgICAnaWNvbnMvYXBwbGUtdG91Y2gtaWNvbi5wbmcnLFxuICAgICAgICAgICdpY29ucy9mYXZpY29uLTMyeDMyLnBuZycsXG4gICAgICAgICAgJ2ljb25zL2Zhdmljb24tMTZ4MTYucG5nJyxcbiAgICAgICAgXSxcbiAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICBuYW1lOiAnQmFpbGFwcCcsXG4gICAgICAgICAgc2hvcnRfbmFtZTogJ0JhaWxhcHAnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3JlYXRlIGNob3Jlb2dyYXBoaWVzLCBsZWFybiBkYW5jZSBtb3ZlcywgdHJhY2sgcHJvZ3Jlc3MnLFxuICAgICAgICAgIHRoZW1lX2NvbG9yOiAnI0VGNDQ0NCcsXG4gICAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogJyNmZmZmZmYnLFxuICAgICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgICBzY29wZTogJy8nLFxuICAgICAgICAgIHN0YXJ0X3VybDogJy8nLFxuICAgICAgICAgIGNhdGVnb3JpZXM6IFsnZW50ZXJ0YWlubWVudCcsICdsaWZlc3R5bGUnLCAnZWR1Y2F0aW9uJ10sXG4gICAgICAgICAgcHJlZmVyX3JlbGF0ZWRfYXBwbGljYXRpb25zOiBmYWxzZSxcbiAgICAgICAgICBpY29uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6ICcvaWNvbnMvaWNvbi0xOTIucG5nJyxcbiAgICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICAgIHB1cnBvc2U6ICdhbnknLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiAnL2ljb25zL2ljb24tNTEyLnBuZycsXG4gICAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgd29ya2JveDoge1xuICAgICAgICAgIGNsZWFudXBPdXRkYXRlZENhY2hlczogdHJ1ZSxcbiAgICAgICAgICBza2lwV2FpdGluZzogdHJ1ZSxcbiAgICAgICAgICBjbGllbnRzQ2xhaW06IHRydWUsXG4gICAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdvZmYyfSddLFxuICAgICAgICAgIC8vIE1vYmlsZS1vcHRpbWl6ZWQgY2FjaGluZyBzdHJhdGVneVxuICAgICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZmlyZWJhc2VzdG9yYWdlXFwuZ29vZ2xlYXBpc1xcLmNvbVxcLy4qL2ksXG4gICAgICAgICAgICAgIGhhbmRsZXI6ICdDYWNoZUZpcnN0JyxcbiAgICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2ZpcmViYXNlLXN0b3JhZ2UtY2FjaGUnLFxuICAgICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDUwLFxuICAgICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzAsIC8vIDMwIGRheXNcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XG4gICAgICAgICAgICAgICAgICBzdGF0dXNlczogWzAsIDIwMF0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvLipcXC5maXJlYmFzZWFwcFxcLmNvbVxcLy4qL2ksXG4gICAgICAgICAgICAgIGhhbmRsZXI6ICdOZXR3b3JrRmlyc3QnLFxuICAgICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnZmlyZWJhc2UtYXBpLWNhY2hlJyxcbiAgICAgICAgICAgICAgICBuZXR3b3JrVGltZW91dFNlY29uZHM6IDMsXG4gICAgICAgICAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgbWF4RW50cmllczogNTAsXG4gICAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQsIC8vIDEgZGF5XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgZGV2T3B0aW9uczoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsIC8vIEVuYWJsZSBQV0EgaW4gZGV2IGZvciB0ZXN0aW5nXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgICB9LFxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICBwb3J0OiA1MTczLFxuICAgICAgaG9zdDogJzAuMC4wLjAnLCAvLyBBbGxvdyBleHRlcm5hbCBjb25uZWN0aW9ucyAocmVxdWlyZWQgZm9yIG5ncm9rKVxuICAgICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgICBhbGxvd2VkSG9zdHM6IFsnLm5ncm9rLWZyZWUuZGV2JywgJy5uZ3Jvay5pbycsICcubmdyb2suYXBwJ10sIC8vIEFsbG93IG5ncm9rIGhvc3RzXG4gICAgICBobXI6IHtcbiAgICAgICAgY2xpZW50UG9ydDogNTE3MyxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgLy8gTW9iaWxlLWZpcnN0IGJ1aWxkIG9wdGltaXphdGlvbnNcbiAgICAgIHRhcmdldDogJ2VzMjAyMCcsXG4gICAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgICBtaW5pZnk6ICd0ZXJzZXInIGFzIGNvbnN0LFxuICAgICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgICBjb21wcmVzczoge1xuICAgICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSwgLy8gUmVtb3ZlIGNvbnNvbGUgbG9ncyBpbiBwcm9kdWN0aW9uXG4gICAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgLy8gU3BsaXQgdmVuZG9yIGNodW5rcyBmb3IgYmV0dGVyIGNhY2hpbmcgb24gbW9iaWxlXG4gICAgICAgICAgICAncmVhY3QtdmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICAgJ2ZpcmViYXNlLXZlbmRvcic6IFsnZmlyZWJhc2UvYXBwJywgJ2ZpcmViYXNlL2F1dGgnLCAnZmlyZWJhc2UvZmlyZXN0b3JlJ10sXG4gICAgICAgICAgICAndWktdmVuZG9yJzogWydsdWNpZGUtcmVhY3QnLCAnY2xzeCcsICd0YWlsd2luZC1tZXJnZSddLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIH0sXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBpbmNsdWRlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgfSxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErVCxPQUFPLFFBQVE7QUFDOVUsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sV0FBVztBQUNsQixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGVBQWU7QUFKeEIsSUFBTSxtQ0FBbUM7QUFPekMsU0FBUyxrQkFBa0I7QUFDekIsUUFBTSxnQkFBZ0IsS0FBSyxRQUFRLGtDQUFXLG1CQUFtQjtBQUVqRSxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixnQkFBZ0IsUUFBUTtBQUV0QixhQUFPLFFBQVEsSUFBSSxhQUFhO0FBRWhDLGFBQU8sUUFBUSxHQUFHLFVBQVUsQ0FBQyxTQUFTO0FBQ3BDLFlBQUksU0FBUyxlQUFlO0FBQzFCLGtCQUFRLElBQUksK0NBQStDO0FBQzNELGlCQUFPLFFBQVE7QUFBQSxRQUNqQjtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWEsTUFBTTtBQUVoQyxRQUFNLGdCQUFnQixLQUFLLFFBQVEsa0NBQVcsbUJBQW1CO0FBQ2pFLE1BQUksYUFBYTtBQUVqQixNQUFJO0FBQ0YsVUFBTSxhQUFhLEdBQUcsYUFBYSxlQUFlLE9BQU87QUFDekQsVUFBTSxRQUFRLFdBQVcsTUFBTSw4QkFBOEI7QUFDN0QsUUFBSSxPQUFPO0FBQ1QsbUJBQWEsTUFBTSxDQUFDLEVBQUUsS0FBSztBQUFBLElBQzdCO0FBQUEsRUFDRixTQUFTLE9BQU87QUFDZCxZQUFRLEtBQUssb0NBQW9DLEtBQUs7QUFBQSxFQUN4RDtBQUVBLFNBQU87QUFBQTtBQUFBLElBRUwsUUFBUTtBQUFBLE1BQ04sMkNBQTJDLEtBQUssVUFBVSxVQUFVO0FBQUEsSUFDdEU7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLGdCQUFnQjtBQUFBLE1B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
