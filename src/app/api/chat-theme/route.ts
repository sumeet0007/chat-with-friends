import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET(
    req: Request
) {
    try {
        const profile = await currentProfile();
        const { searchParams } = new URL(req.url);

        const chatId = searchParams.get("chatId");

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!chatId) {
            return new NextResponse("Chat ID missing", { status: 400 });
        }

        const theme = await (db as any).chatTheme.findUnique({
            where: {
                chatId: chatId,
            }
        });

        return NextResponse.json(theme);
    } catch (error) {
        console.log("[CHAT_THEME_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request
) {
    try {
        const profile = await currentProfile();
        const { chatId, backgroundImage, backgroundColor } = await req.json();

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!chatId) {
            return new NextResponse("Chat ID missing", { status: 400 });
        }

        const theme = await (db as any).chatTheme.upsert({
            where: {
                chatId: chatId,
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

        return NextResponse.json(theme);
    } catch (error) {
        console.log("[CHAT_THEME_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
