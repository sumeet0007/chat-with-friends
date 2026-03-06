import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const UserProfilePage = () => {
    return (
        <div className="flex flex-col h-full w-full items-center justify-center p-4 bg-[#F2F3F5] dark:bg-[#313338]">
            <div className="w-full max-w-5xl mb-4">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 text-zinc-500 dark:text-zinc-400">
                        <ArrowLeft className="h-4 w-4" />
                        Back to App
                    </Button>
                </Link>
            </div>
            <UserProfile path="/user-profile" routing="path" />
        </div>
    );
}

export default UserProfilePage;
