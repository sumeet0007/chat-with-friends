import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const initialProfile = async () => {
    const user = await currentUser();

    if (!user) {
        // If not logged in, redirect to sign in
        return redirect("/sign-in");
    }

    // Check if profile already exists in our db
    const profile = await db.profile.findUnique({
        where: {
            userId: user.id
        }
    });

    if (profile) {
        return profile;
    }

    // Create new profile locally if they don't exist yet
    const newProfile = await db.profile.create({
        data: {
            userId: user.id,
            name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User",
            imageUrl: user.imageUrl,
            email: user.emailAddresses[0].emailAddress
        }
    });

    return newProfile;
};
