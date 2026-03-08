import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return new NextResponse("Invalid subscription", { status: 400 });
    }

    // Check if it already exists
    const existing = await db.pushSubscription.findUnique({
      where: {
        endpoint: subscription.endpoint,
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const newSubscription = await db.pushSubscription.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        profileId: profile.id,
      },
    });

    return NextResponse.json(newSubscription);
  } catch (error) {
    console.log("[WEB_PUSH_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
