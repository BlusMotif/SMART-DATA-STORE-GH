import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
// import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  plugins: [
    react({
      jsxRuntime: "automatic",
      jsxImportSource: "react",
    }),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    //   },
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    //   manifest: {
    //     name: 'resellershubprogh.com - Data & Result Checker',
    //     short_name: 'ResellersHubPro',
    //     description: 'Buy data bundles and WAEC result checkers instantly. Secure payments via Paystack.',
    //     theme_color: '#0f172a',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   }
    // }),
  ],

  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../src/shared"),
      "@assets": path.resolve(__dirname, "assets"),
    },
  },

  root: ".",

  css: {
    // PostCSS configured via tailwind.config.js
  },

  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: "./index.html",
      output: {
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        manualChunks(id: string) {
          if (!id) return;
          if (id.includes("node_modules")) {
            if (id.includes("jspdf")) return "vendor_jspdf";
            return "vendor";
          }
        },
      },
    },
  },

  server: {
    host: true, // bind to all interfaces
    port: Number(process.env.CLIENT_PORT) || 5173,
    strictPort: true,
    allowedHosts: ["resellershubprogh.com", "localhost"],
    watch: { usePolling: true },
    fs: { strict: true, deny: ["**/.*"] },
    hmr: true, // Enable HMR for better development experience
    proxy: {
      '/api': {
        target: 'http://localhost:10000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  cacheDir: "node_modules/.vite",

  optimizeDeps: {
    include: ["react", "react-dom", "axios", "lodash", "jspdf"],
  },
});
