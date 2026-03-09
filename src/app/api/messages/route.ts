import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { getChannelMessages } from "@/lib/services/message-service";
import { messageRateLimiter } from "@/lib/rate-limit";

export async function GET(
    req: Request
) {
    try {
        const profile = await currentProfile();
        const { searchParams } = new URL(req.url);

        const cursor = searchParams.get("cursor");
        const channelId = searchParams.get("channelId");

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!channelId) {
            return new NextResponse("Channel ID missing", { status: 400 });
        }

        // Rate limiting check
        const rateLimit = messageRateLimiter.checkLimit(`messages:get:${profile.id}`);
        if (!rateLimit.success) {
            return new NextResponse(rateLimit.message, { 
                status: 429,
                headers: {
                    "X-RateLimit-Reset": rateLimit.resetTime.toString(),
                }
            });
        }

        const messages = await getChannelMessages({
            channelId,
            cursor,
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.log("[MESSAGES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
