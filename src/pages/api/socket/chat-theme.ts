import { NextApiRequest } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { NextApiResponseServerIo } from "@/types";
import { db } from "@/lib/db";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponseServerIo
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { userId } = getAuth(req);
        const { chatId, backgroundImage, backgroundColor } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!chatId) {
            return res.status(400).json({ error: "Chat ID missing" });
        }

        const profile = await db.profile.findUnique({
            where: {
                userId
            }
        });

        if (!profile) {
            return res.status(401).json({ error: "Profile not found" });
        }

        // Update or create the shared chat theme
        const theme = await (db as any).chatTheme.upsert({
            where: {
                chatId,
            },
            update: {
                backgroundImage,
                backgroundColor,
            },
            create: {
                chatId,
                backgroundImage,
                backgroundColor,
            }
        });

        const updateKey = `chat:${chatId}:theme:update`;
        res?.socket?.server?.io?.emit(updateKey, theme);

        return res.status(200).json(theme);
    } catch (error) {
        console.log("[CHAT_THEME_POST]", error);
        return res.status(500).json({ message: "Internal Error" });
    }
}
