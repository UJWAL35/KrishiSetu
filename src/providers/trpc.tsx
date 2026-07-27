/* eslint-disable react-refresh/only-export-components */
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";
import { AUTH_KEY } from "@/pages/Login";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Don't retry on 4xx errors (auth failures, not found, etc.)
            retry: (failureCount, error: any) => {
                const code = error?.data?.code;
                if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
                    // Clear stale auth so layouts redirect cleanly to login
                    localStorage.removeItem(AUTH_KEY);
                    return false;
                }
                return failureCount < 2;
            },
        },
        mutations: {
            retry: false,
        },
    },
});

const trpcClient = trpc.createClient({
    links: [
        httpBatchLink({
            url: "/api/trpc",
            transformer: superjson,
            fetch(input, init) {
                return globalThis.fetch(input, {
                    ...(init ?? {}),
                    credentials: "include",
                });
            },
        }),
    ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    );
}
