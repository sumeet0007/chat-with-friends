import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useState, useRef } from "react";
import { setTokenGetter, clearTokenCache } from "@/lib/api";

export default function AuthMiddleware({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const hasSetTokenGetter = useRef(false);

    // Sync token getter for API calls as early as possible
    useEffect(() => {
        if (isLoaded && !hasSetTokenGetter.current) {
            console.log("[AuthMiddleware] Setting token getter. SignedIn:", isSignedIn);
            setTokenGetter(() => getToken());
            hasSetTokenGetter.current = true;
        }

        if (isLoaded && !isSignedIn) {
            clearTokenCache();
        }
    }, [isLoaded, isSignedIn, getToken]);

    useEffect(() => {
        if (!isLoaded || isNavigating) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (isSignedIn && inAuthGroup) {
            setIsNavigating(true);
            console.log("[AuthMiddleware] Redirecting to (tabs)");
            router.replace("/(tabs)");
        } else if (!isSignedIn && !inAuthGroup) {
            setIsNavigating(true);
            console.log("[AuthMiddleware] Redirecting to (auth)");
            router.replace("/(auth)/sign-in");
        }
    }, [isSignedIn, isLoaded, segments, isNavigating]);

    // Reset navigation state when segments change
    useEffect(() => {
        setIsNavigating(false);
    }, [segments]);

    if (!isLoaded) return null;

    return <>{children}</>;
}
