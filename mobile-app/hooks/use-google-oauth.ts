import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useOAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect } from "react";

// Warm up the browser for faster OAuth
WebBrowser.maybeCompleteAuthSession();

export const useGoogleOAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const signInWithGoogle = useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/dashboard", { scheme: "mobileapp" }),
      });

      if (createdSessionId) {
        if (setActive) {
           await setActive({ session: createdSessionId });
        }
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error("OAuth error", err);
    }
  }, [startOAuthFlow]);

  return { signInWithGoogle };
};
