import * as z from "zod";

export const createMessageSchema = z.object({
    content: z.string().min(1, "Message content is required"),
    fileUrl: z.string().url().optional().or(z.literal("")),
    replyToId: z.string().uuid().optional().or(z.null()),
});

export const updateMessageSchema = z.object({
    content: z.string().min(1, "Message content is required"),
    fileUrl: z.string().url().optional().or(z.literal("")),
});

export const messageIdSchema = z.string().uuid("Invalid message ID");
