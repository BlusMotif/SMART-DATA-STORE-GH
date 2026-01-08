import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
      jsxImportSource: "react",
    }),
  ],

  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "assets"),
    },
  },

  root: ".",

  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
    postcssOptions: {
      from: undefined,
    },
  },

  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        manualChunks(id: string) {
          if (!id) return;
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) return "vendor_react";
            if (id.includes("jspdf")) return "vendor_jspdf";
            if (id.includes("lodash")) return "vendor_lodash";
            if (id.includes("axios")) return "vendor_axios";
            return "vendor";
          }
        },
      },
    },
  },

  server: {
    host: true, // bind to all interfaces
    port: Number(process.env.PORT) || 3000,
    strictPort: true,
    allowedHosts: ["smartdatastoregh.onrender.com", "localhost"],
    watch: { usePolling: true },
    fs: { strict: true, deny: ["**/.*"] },
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.PORT || 3000}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },

  cacheDir: "node_modules/.vite",

  optimizeDeps: {
    force: true,
    include: ["react", "react-dom", "axios", "lodash", "jspdf"],
  },
});
