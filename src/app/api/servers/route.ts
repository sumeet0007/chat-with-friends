import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { createServerSchema } from "@/lib/validations/server";
import { apiRateLimiter } from "@/lib/rate-limit";
import { getIdentifierFromRequest } from "@/lib/rate-limit";

export async function GET(req: Request) {
    try {
        const profile = await currentProfile();

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Rate limiting check
        const rateLimit = apiRateLimiter.checkLimit(`servers:get:${profile.id}`);
        if (!rateLimit.success) {
            return new NextResponse(rateLimit.message, { 
                status: 429,
                headers: {
                    "X-RateLimit-Reset": rateLimit.resetTime.toString(),
                }
            });
        }

        const servers = await db.server.findMany({
            where: {
                members: {
                    some: {
                        profileId: profile.id
                    }
                }
            },
            include: {
                channels: {
                    orderBy: {
                        createdAt: "asc"
                    }
                },
                members: {
                    include: {
                        profile: true
                    },
                    orderBy: {
                        role: "asc"
                    }
                }
            }
        });

        return NextResponse.json(servers);
    } catch (error) {
        console.log("[SERVERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await currentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get the profile from our DB
        const profile = await db.profile.findUnique({
            where: {
                userId: user.id
            }
        });

        if (!profile) {
            return new NextResponse("Profile not found", { status: 404 });
        }

        // Rate limiting check
        const rateLimit = apiRateLimiter.checkLimit(`servers:post:${user.id}`);
        if (!rateLimit.success) {
            return new NextResponse(rateLimit.message, { 
                status: 429,
                headers: {
                    "X-RateLimit-Reset": rateLimit.resetTime.toString(),
                }
            });
        }

        const body = await req.json();
        const validatedData = createServerSchema.parse(body);

        const finalImageUrl = validatedData.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(validatedData.name)}&background=5865F2&color=fff`;

        const server = await db.server.create({
            data: {
                profileId: profile.id,
                name: validatedData.name,
                imageUrl: finalImageUrl,
                inviteCode: crypto.randomUUID(),
                channels: {
                    create: [
                        { name: "general", profileId: profile.id }
                    ]
                },
                members: {
                    create: [
                        { profileId: profile.id, role: MemberRole.ADMIN }
                    ]
                }
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        if (error instanceof Error && error.constructor.name === "ZodError") {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.log("[SERVERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
