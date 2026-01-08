import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: [],
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "assets"),
    },
  },
  root: ".",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    hmr: {
      host: 'localhost',
      port: Number(process.env.PORT) || 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:10002',
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    watch: {
      usePolling: true,
    },
  },
  cacheDir: 'node_modules/.vite',
  optimizeDeps: {
    force: true,
  },
});