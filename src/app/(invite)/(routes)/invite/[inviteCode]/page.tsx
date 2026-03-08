import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";

interface InviteCodePageProps {
  params: Promise<{
    inviteCode: string;
  }>;
}

const InviteCodePage = async ({
  params
}: InviteCodePageProps) => {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await currentUser();
  if (!user) {
    return redirectToSignIn();
  }

  let profile = await db.profile.findUnique({
    where: {
      userId: user.id
    }
  });

  if (!profile) {
    profile = await db.profile.create({
      data: {
        userId: user.id,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User",
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress
      }
    });
  }

  const { inviteCode } = await params;

  if (!inviteCode) {
    return redirect("/");
  }

  const existingServer = await db.server.findFirst({
    where: {
      inviteCode: inviteCode,
      members: {
        some: {
          profileId: profile.id
        }
      }
    }
  });

  if (existingServer) {
    return redirect(`/servers/${existingServer.id}`);
  }

  try {
    const server = await db.server.update({
      where: {
        inviteCode: inviteCode,
      },
      data: {
        members: {
          create: [
            {
              profileId: profile.id,
            }
          ]
        }
      }
    });

    if (server) {
      return redirect(`/servers/${server.id}`);
    }
  } catch (error) {
    console.error("Invite Code Error:", error);
    return redirect("/");
  }

  return null;
}

export default InviteCodePage;
