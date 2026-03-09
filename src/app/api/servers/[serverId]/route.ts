import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { updateServerSchema } from "@/lib/validations/server";
import { apiRateLimiter } from "@/lib/rate-limit";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const profile = await currentProfile();
        const { serverId } = await params;

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!serverId) {
            return new NextResponse("Server ID Missing", { status: 400 });
        }

        // Rate limiting check
        const rateLimit = apiRateLimiter.checkLimit(`servers:delete:${profile.id}`);
        if (!rateLimit.success) {
            return new NextResponse(rateLimit.message, { 
                status: 429,
                headers: {
                    "X-RateLimit-Reset": rateLimit.resetTime.toString(),
                }
            });
        }

        const server = await db.server.delete({
            where: {
                id: serverId,
                profileId: profile.id,
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        console.log("[SERVER_ID_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ serverId: string }> }
) {
    try {
        const profile = await currentProfile();
        const { serverId } = await params;

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!serverId) {
            return new NextResponse("Server ID Missing", { status: 400 });
        }

        // Rate limiting check
        const rateLimit = apiRateLimiter.checkLimit(`servers:patch:${profile.id}`);
        if (!rateLimit.success) {
            return new NextResponse(rateLimit.message, { 
                status: 429,
                headers: {
                    "X-RateLimit-Reset": rateLimit.resetTime.toString(),
                }
            });
        }

        const body = await req.json();
        const validatedData = updateServerSchema.parse(body);

        const server = await db.server.update({
            where: {
                id: serverId,
                profileId: profile.id,
            },
            data: {
                name: validatedData.name,
                imageUrl: validatedData.imageUrl,
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        if (error instanceof Error && error.constructor.name === "ZodError") {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.log("[SERVER_ID_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

