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

    console.log('[WEB_PUSH] Creating/updating subscription for profile:', profile.id);

    // Use upsert to handle duplicates gracefully
    const pushSubscription = await db.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        profileId: profile.id, // Update profile association
        updatedAt: new Date(),
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        profileId: profile.id,
      },
    });

    console.log('[WEB_PUSH] Subscription saved:', pushSubscription.id);
    return NextResponse.json(pushSubscription);
    
  } catch (error) {
    console.error("[WEB_PUSH_POST] Error:", error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000 || error.message.includes('duplicate key')) {
      console.log('[WEB_PUSH] Duplicate key detected, trying to find existing subscription');
      try {
        const existing = await db.pushSubscription.findUnique({
          where: { endpoint: subscription.endpoint }
        });
        if (existing) {
          return NextResponse.json(existing);
        }
      } catch (findError) {
        console.error('[WEB_PUSH] Error finding existing subscription:', findError);
      }
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}
