import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    console.log('[PIN_TEST] Testing database connection and pin fields...');
    
    // Test basic database connection
    const messageCount = await db.message.count();
    console.log('[PIN_TEST] Total messages in database:', messageCount);
    
    // Test if pin fields exist
    const pinnedCount = await db.message.count({
      where: { pinned: true }
    });
    console.log('[PIN_TEST] Pinned messages count:', pinnedCount);
    
    // Test a simple query with pin fields
    const sampleMessage = await db.message.findFirst({
      select: {
        id: true,
        pinned: true,
        pinnedAt: true,
        pinnedById: true,
        content: true
      }
    });
    console.log('[PIN_TEST] Sample message with pin fields:', sampleMessage);
    
    return NextResponse.json({
      success: true,
      totalMessages: messageCount,
      pinnedMessages: pinnedCount,
      sampleMessage,
      message: 'Pin fields are working correctly'
    });
    
  } catch (error) {
    console.error('[PIN_TEST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Pin fields test failed - database schema might need updating'
    }, { status: 500 });
  }
}