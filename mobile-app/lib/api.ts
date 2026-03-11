import axios from "axios";

export const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
});

let tokenGetter: (() => Promise<string | null>) | null = null;

export const setTokenGetter = (getter: () => Promise<string | null>) => {
    tokenGetter = getter;
};

let cachedToken: string | null = null;
let lastFetchTime = 0;
const TOKEN_CACHE_MS = 5000; // Cache for 5s to reduce latency but stay fresh

// Intercept requests and dynamically fetch the token
api.interceptors.request.use(async (config) => {
    if (tokenGetter) {
        const now = Date.now();
        if (!cachedToken || (now - lastFetchTime > TOKEN_CACHE_MS)) {
            cachedToken = await tokenGetter();
            lastFetchTime = now;
        }
        
        if (cachedToken) {
            config.headers.Authorization = `Bearer ${cachedToken}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
