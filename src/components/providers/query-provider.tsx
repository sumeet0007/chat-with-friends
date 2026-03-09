"use client";

import {
    QueryClient,
    QueryClientProvider
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useMemo } from "react";

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // With SSR, we usually want to set some default staleTime
                // above 0 to avoid refetching immediately on the client
                staleTime: 60 * 1000, // 1 minute
                retry: 2,
                refetchOnWindowFocus: false,
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: always make a new query client
        return makeQueryClient();
    } else {
        // Browser: make a new query client if we don't already have one
        // This is important for React 18+ strict mode which unmounts and remounts components
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}

export const QueryProvider = ({
    children
}: {
    children: React.ReactNode;
}) => {
    // This ensures the query client is created once and reused
    // avoiding the issue with useState in strict mode
    const queryClient = useMemo(() => getQueryClient(), []);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* React Query Devtools for development */}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    );
};
