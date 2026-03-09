import * as z from "zod";

export const createServerSchema = z.object({
    name: z.string().min(1, "Server name is required").max(50, "Server name must be less than 50 characters"),
    imageUrl: z.string().url().optional().or(z.literal("")),
});

export const updateServerSchema = z.object({
    name: z.string().min(1, "Server name is required").max(50, "Server name must be less than 50 characters"),
    imageUrl: z.string().url().optional().or(z.literal("")),
});

export const serverIdSchema = z.string().uuid("Invalid server ID");
