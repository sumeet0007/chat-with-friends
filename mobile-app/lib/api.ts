import axios from "axios";

console.log("[API] Initializing with baseURL:", process.env.EXPO_PUBLIC_API_URL);

export const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 15000,
});

let tokenGetter: (() => Promise<string | null>) | null = null;

export const setTokenGetter = (getter: () => Promise<string | null>) => {
    console.log("[API] Token getter registered");
    tokenGetter = getter;
};

let cachedToken: string | null = null;
let lastFetchTime = 0;
const TOKEN_CACHE_MS = 1000 * 60 * 5;

export const clearTokenCache = () => {
    console.log("[API] Clearing token cache");
    cachedToken = null;
    lastFetchTime = 0;
};

api.interceptors.request.use(async (config) => {
    if (tokenGetter) {
        try {
            const now = Date.now();
            if (!cachedToken || (now - lastFetchTime > TOKEN_CACHE_MS)) {
                cachedToken = await tokenGetter();
                lastFetchTime = now;
                console.log("[API] New Token Fetched. Length:", cachedToken?.length || 0);
            }

            if (cachedToken) {
                config.headers.Authorization = `Bearer ${cachedToken}`;
            } else {
                console.warn("[API] No token available for this request:", config.url);
            }
        } catch (e) {
            console.error("[API] Failed to attach token:", e);
        }
    } else {
        console.warn("[API] Request made before tokenGetter was set:", config.url);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Log detailed error for debugging
        console.error("[API Error]", {
            url: originalRequest?.url,
            method: originalRequest?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.warn("[API] 401 Unauthorized from server at:", originalRequest.url);

            clearTokenCache();

            if (tokenGetter) {
                try {
                    const newToken = await tokenGetter();
                    if (newToken) {
                        console.log("[API] Retrying with fresh token...");
                        cachedToken = newToken;
                        lastFetchTime = Date.now();
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    }
                } catch (retryError) {
                    console.error("[API] Token refresh during retry failed:", retryError);
                }
            }
        }

        return Promise.reject(error);
    }
);
