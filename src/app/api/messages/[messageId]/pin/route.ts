import { NextRequest, NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);
    const { action } = await req.json();

    const serverId = searchParams.get("serverId");
    const channelId = searchParams.get("channelId");
    const conversationId = searchParams.get("conversationId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!messageId) {
      return new NextResponse("Message ID missing", { status: 400 });
    }

    if (!action || !["pin", "unpin"].includes(action)) {
      return new NextResponse("Invalid action", { status: 400 });
    }

    // Handle channel messages
    if (serverId && channelId) {
      const server = await db.server.findFirst({
        where: {
          id: serverId,
          members: {
            some: {
              profileId: profile.id,
            }
          }
        },
        include: {
          members: true,
        }
      });

      if (!server) {
        return new NextResponse("Server not found", { status: 404 });
      }

      const channel = await db.channel.findFirst({
        where: {
          id: channelId,
          serverId: serverId,
        },
      });

      if (!channel) {
        return new NextResponse("Channel not found", { status: 404 });
      }

      const member = server.members.find((member) => member.profileId === profile.id);

      if (!member) {
        return new NextResponse("Member not found", { status: 404 });
      }

      const message = await db.message.update({
        where: {
          id: messageId,
          channelId: channelId,
        },
        data: {
          pinned: action === "pin",
          pinnedAt: action === "pin" ? new Date() : null,
          pinnedById: action === "pin" ? member.id : null,
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
        }
      });

      return NextResponse.json(message);
    }

    // Handle direct messages
    if (conversationId) {
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
        },
        include: {
          memberOne: {
            include: {
              profile: true,
            }
          },
          memberTwo: {
            include: {
              profile: true,
            }
          }
        }
      });

      if (!conversation) {
        return new NextResponse("Conversation not found", { status: 404 });
      }

      const member = conversation.memberOne.profileId === profile.id 
        ? conversation.memberOne 
        : conversation.memberTwo;

      const directMessage = await db.directMessage.update({
        where: {
          id: messageId,
          conversationId: conversationId,
        },
        data: {
          pinned: action === "pin",
          pinnedAt: action === "pin" ? new Date() : null,
          pinnedById: action === "pin" ? member.id : null,
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
        }
      });

      return NextResponse.json(directMessage);
    }

    return new NextResponse("Missing required parameters", { status: 400 });

  } catch (error) {
    console.log("[MESSAGE_PIN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
