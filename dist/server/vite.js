import { createServer as createViteServer, createLogger } from "vite";
// @ts-ignore
import viteConfig from "../../client/vite.config.js";
// The client and server may have different installed Vite types; avoid leaking
// the client vite types into the server build by treating the imported
// client config as an unknown/any when merging for the dev server setup.
const clientViteConfig = viteConfig;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
const viteLogger = createLogger();
export async function setupVite(server, app) {
    const serverOptions = {
        middlewareMode: true,
        hmr: { server, path: "/vite-hmr" },
        allowedHosts: true,
    };
    const vite = await createViteServer({
        ...clientViteConfig,
        configFile: false,
        root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..", "client"),
        customLogger: {
            ...viteLogger,
            error: (msg, options) => {
                viteLogger.error(msg, options);
            },
        },
        server: serverOptions,
        appType: "custom",
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
        const url = req.originalUrl;
        // Skip API routes and static assets that should be handled by Vite middleware
        if (req.path.startsWith('/api') ||
            req.path.startsWith('/vite-hmr') ||
            req.path.startsWith('/src/') ||
            req.path.startsWith('/@') ||
            req.path.startsWith('/node_modules/') ||
            req.path.includes('.js') ||
            req.path.includes('.css') ||
            req.path.includes('.json') ||
            req.path.includes('.png') ||
            req.path.includes('.ico') ||
            req.path.includes('.svg') ||
            req.path.includes('.woff') ||
            req.path.includes('.woff2') ||
            req.path.includes('.ttf') ||
            req.path.includes('.eot')) {
            return next();
        }
        try {
            const clientTemplate = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..", "client", "index.html");
            // always reload the index.html file from disk incase it changes
            let template = await fs.promises.readFile(clientTemplate, "utf-8");
            template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
            const page = await vite.transformIndexHtml(url, template);
            res.status(200).set({ "Content-Type": "text/html" }).end(page);
        }
        catch (e) {
            vite.ssrFixStacktrace(e);
            next(e);
        }
    });
}
