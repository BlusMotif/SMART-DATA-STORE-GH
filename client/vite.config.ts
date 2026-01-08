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
    // Use the platform-provided PORT when present so preview/dev bind correctly
    // on hosting platforms like Render. `host: true` makes the server listen
    // on all interfaces which is required for containerized deployments.
    host: true,
    port: Number(process.env.PORT) || 3000,
    // Avoid forcing HMR to a conflicting port; let Vite choose defaults when
    // running locally. If needed, Vite's HMR will infer settings from the
    // dev server environment.
    proxy: {
      '/api': {
        // Proxy API requests to the backend running on the same PORT in dev.
        target: `http://localhost:${process.env.PORT || 3000}`,
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