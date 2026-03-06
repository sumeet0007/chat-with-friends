import { PrismaClient } from "@prisma/client";

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// In development, the Next.js hot-reloading feature can cause multiple Prisma 
// Client instances to be initialized, exhausting the database connection limit.
// We bind it to the globally scoped object to prevent this.
export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
