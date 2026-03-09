import { NextResponse } from "next/server";
import { MemberRole } from "@prisma/client";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { createChannelSchema } from "@/lib/validations/channel";
import { apiRateLimiter } from "@/lib/rate-limit";

export async function POST(
    req: Request
) {
    try {
        const profile = await currentProfile();
        const { name, type } = await req.json();
        const { searchParams } = new URL(req.url);

        const serverId = searchParams.get("serverId");

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!serverId) {
            return new NextResponse("Server ID missing", { status: 400 });
        }

        if (name === "general") {
            return new NextResponse("Name cannot be 'general'", { status: 400 });
        }

        // Rate limiting check
        const rateLimit = apiRateLimiter.checkLimit(`channels:post:${profile.id}`);
        if (!rateLimit.success) {
            return new NextResponse(rateLimit.message, { 
                status: 429,
                headers: {
                    "X-RateLimit-Reset": rateLimit.resetTime.toString(),
                }
            });
        }

        // Validate request body
        const validatedData = createChannelSchema.parse({ name, type });

        const server = await db.server.update({
            where: {
                id: serverId,
                members: {
                    some: {
                        profileId: profile.id,
                        role: {
                            in: [MemberRole.ADMIN, MemberRole.MODERATOR]
                        }
                    }
                }
            },
            data: {
                channels: {
                    create: {
                        profileId: profile.id,
                        name: validatedData.name,
                        type: validatedData.type,
                    }
                }
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        if (error instanceof Error && error.constructor.name === "ZodError") {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.log("CHANNELS_POST", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
