import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

// Use a plain Hono app without Node-specific bindings so it works on Vercel serverless
const app = new Hono();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
    return fetchRequestHandler({
        endpoint: "/api/trpc",
        req: c.req.raw,
        router: appRouter,
        createContext,
    });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

// Only start a local Node server when running outside Vercel
if (env.isProduction && !process.env.VERCEL) {
    // Dynamic import so Vercel's bundler doesn't pull in @hono/node-server
    import("@hono/node-server").then(({ serve }) => {
        import("./lib/vite").then(({ serveStaticFiles }) => {
            serveStaticFiles(app);
            const port = parseInt(process.env.PORT || "3000");
            serve({ fetch: app.fetch, port }, () => {
                console.log(`Server running on http://localhost:${port}/`);
            });
        });
    });
}
