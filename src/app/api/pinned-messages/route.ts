import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");
    const channelId = searchParams.get("channelId");
    const conversationId = searchParams.get("conversationId");

    console.log('[PINNED_MESSAGES_GET] Request params:', { serverId, channelId, conversationId });

    if (!profile) {
      console.log('[PINNED_MESSAGES_GET] No profile found');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Handle channel messages
    if (serverId && channelId) {
      console.log('[PINNED_MESSAGES_GET] Fetching channel pinned messages');
      
      const server = await db.server.findFirst({
        where: {
          id: serverId,
          members: {
            some: {
              profileId: profile.id,
            }
          }
        }
      });

      if (!server) {
        console.log('[PINNED_MESSAGES_GET] Server not found or no access');
        return new NextResponse("Server not found", { status: 404 });
      }

      const pinnedMessages = await db.message.findMany({
        where: {
          channelId: channelId,
          pinned: true,
          deleted: false,
        },
        include: {
          member: {
            include: {
              profile: true,
            }
          },
          replyTo: {
            include: {
              member: {
                include: {
                  profile: true,
                }
              }
            }
          }
        },
        orderBy: [
          { pinnedAt: "desc" },
          { createdAt: "desc" }
        ],
        take: 50,
      });

      console.log('[PINNED_MESSAGES_GET] Found channel messages:', pinnedMessages.length);
      return NextResponse.json(pinnedMessages);
    }

    // Handle direct messages
    if (conversationId) {
      console.log('[PINNED_MESSAGES_GET] Fetching conversation pinned messages');
      
      const conversation = await db.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            {
              memberOne: {
                profileId: profile.id,
              }
            },
            {
              memberTwo: {
                profileId: profile.id,
              }
            }
          ]
        }
      });

      if (!conversation) {
        console.log('[PINNED_MESSAGES_GET] Conversation not found or no access');
        return new NextResponse("Conversation not found", { status: 404 });
      }

      const pinnedMessages = await db.directMessage.findMany({
        where: {
          conversationId: conversationId,
          pinned: true,
          deleted: false,
        },
        include: {
          member: {
            include: {
              profile: true,
            }
          },
          replyTo: {
            include: {
              member: {
                include: {
                  profile: true,
                }
              }
            }
          }
        },
        orderBy: [
          { pinnedAt: "desc" },
          { createdAt: "desc" }
        ],
        take: 50,
      });

      console.log('[PINNED_MESSAGES_GET] Found conversation messages:', pinnedMessages.length);
      return NextResponse.json(pinnedMessages);
    }

    console.log('[PINNED_MESSAGES_GET] Missing required parameters');
    return new NextResponse("Missing required parameters", { status: 400 });

  } catch (error) {
    console.error("[PINNED_MESSAGES_GET] Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}