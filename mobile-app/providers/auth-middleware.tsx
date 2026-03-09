import { Slot, useRouter, useSegments } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { setAuthToken } from "@/lib/api";

export default function AuthMiddleware({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        console.log("AuthMiddleware - Loaded:", isLoaded, "SignedIn:", isSignedIn, "Segments:", segments);
        if (!isLoaded) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (isSignedIn && inAuthGroup) {
            router.replace("/(tabs)");
        } else if (!isSignedIn && !inAuthGroup) {
            router.replace("/(auth)/sign-in");
        }

        if (isSignedIn) {
            getToken().then(token => {
                setAuthToken(token);
            });
        } else {
            setAuthToken(null);
        }
    }, [isSignedIn, isLoaded, segments]);

    return <>{children}</>;
}
