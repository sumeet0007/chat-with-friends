import admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (serviceAccountKey) {
            // Check if the string is already a JSON or needs parsing
            const serviceAccount = JSON.parse(serviceAccountKey);
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("[Firebase] Admin SDK initialized successfully");
        } else {
            console.warn("[Firebase] Warning: FIREBASE_SERVICE_ACCOUNT_KEY is missing. Push notifications to Android might be limited.");
        }
    } catch (error) {
        console.error("[Firebase] Initialization error:", error);
    }
}

export const messaging = admin.apps.length ? admin.messaging() : null;
export default admin;
