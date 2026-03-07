import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const currentProfile = async () => {
    const { userId } = await auth();

    if (!userId) {
        return null;
    }

    const profile = await db.profile.findUnique({
        where: {
            userId
        }
    });

    // Sync latest user details from Clerk
    if (profile) {
        const user = await currentUser();
        if (user) {
            const currentName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User";
            if (profile.name !== currentName || profile.imageUrl !== user.imageUrl) {
                await db.profile.update({
                    where: { userId },
                    data: {
                        name: currentName,
                        imageUrl: user.imageUrl
                    }
                });

                // Return the updated data
                profile.name = currentName;
                profile.imageUrl = user.imageUrl;
            }
        }
    }

    return profile;
}
