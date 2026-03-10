import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return new NextResponse("Invalid push token", { status: 400 });
    }

    // Check if it already exists
    const existing = await db.expoPushToken.findUnique({
      where: {
        token: token,
      },
    });

    if (existing) {
      if (existing.profileId !== profile.id) {
        // If an existing token belongs to someone else, reassign
        await db.expoPushToken.update({
          where: { token },
          data: { profileId: profile.id }
        });
      }
      return NextResponse.json(existing);
    }

    const newToken = await db.expoPushToken.create({
      data: {
        token: token,
        profileId: profile.id,
      },
    });

    return NextResponse.json(newToken);
  } catch (error) {
    console.log("[EXPO_PUSH_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return new NextResponse("Invalid push token", { status: 400 });
    }

    await db.expoPushToken.deleteMany({
      where: {
        token: token,
        profileId: profile.id
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[EXPO_PUSH_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
