import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    base: "/",
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
            "@shared": path.resolve(__dirname, "../src/shared"),
            "@assets": path.resolve(__dirname, "assets"),
        },
    },
    root: ".",
    css: {
        postcss: {
            plugins: [tailwindcss(), autoprefixer()],
        },
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
                manualChunks(id) {
                    if (!id)
                        return;
                    if (id.includes("node_modules")) {
                        if (id.includes("jspdf"))
                            return "vendor_jspdf";
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
        allowedHosts: ["smartdatastoregh.onrender.com", "localhost"],
        watch: { usePolling: true },
        fs: { strict: true, deny: ["**/.*"] },
    },
    cacheDir: "node_modules/.vite",
    optimizeDeps: {
        force: true,
        include: ["react", "react-dom", "axios", "lodash", "jspdf"],
    },
});
