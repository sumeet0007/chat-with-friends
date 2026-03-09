import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    const body = await req.json();
    const { 
      deviceId, 
      deviceModel, 
      os, 
      osVersion, 
      latitude, 
      longitude, 
      accuracy, 
      event, 
      metadata 
    } = body;

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";

    const telemetry = await db.telemetry.create({
      data: {
        userId: profile.userId,
        profileId: profile.id,
        deviceId,
        deviceModel,
        os,
        osVersion,
        ip,
        latitude,
        longitude,
        accuracy,
        event,
        metadata
      }
    });

    return NextResponse.json(telemetry);
  } catch (error) {
    console.log("[TELEMETRY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
