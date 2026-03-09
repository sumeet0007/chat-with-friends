import * as z from "zod";

export const createChannelSchema = z.object({
    name: z.string().min(1, "Channel name is required").max(50, "Channel name must be less than 50 characters"),
    type: z.enum(["TEXT", "AUDIO", "VIDEO"]),
});

export const updateChannelSchema = z.object({
    name: z.string().min(1, "Channel name is required").max(50, "Channel name must be less than 50 characters"),
    type: z.enum(["TEXT", "AUDIO", "VIDEO"]),
});

export const channelIdSchema = z.string().uuid("Invalid channel ID");
