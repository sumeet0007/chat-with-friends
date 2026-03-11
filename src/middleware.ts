import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/uploadthing(.*)',
    '/api/webhook(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
    const { pathname } = req.nextUrl;
    console.log(`[Incoming Request] ${req.method} ${pathname}`);

    // Handle CORS for mobile app and other clients
    if (pathname.startsWith('/api/')) {
        const response = NextResponse.next();

        // In production, you might want to specify allowed origins, but '*' works for mobile apps
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 204,
                headers: response.headers
            });
        }

        // Protect non-public API routes
        if (!isPublicRoute(req)) {
            await auth.protect();
        }

        return response;
    }

    // Protect all other pages except public ones
    if (!isPublicRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
