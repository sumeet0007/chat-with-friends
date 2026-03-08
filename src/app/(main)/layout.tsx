import { NavigationSidebar } from "@/components/navigation/navigation-sidebar";
import { ModalProvider } from "@/components/providers/modal-provider";
import { currentProfile } from "@/lib/current-profile";
import { SocketRevalidator } from "@/components/socket-revalidator";
import { redirect } from "next/navigation";

const MainLayout = async ({
    children
}: {
    children: React.ReactNode;
}) => {
    const profile = await currentProfile();

    if (!profile) {
        return redirect("/");
    }

    return (
        <div className="h-full">
            <SocketRevalidator profileId={profile.id} />
            <div className="lg:block! hidden flex max-md:hidden h-full w-[72px] z-30 flex-col fixed inset-y-0">
                <NavigationSidebar />
            </div>
            <main className="md:pl-[72px] h-full">
                <ModalProvider profileId={profile.id} />
                {children}
            </main>
        </div>
    );
}

export default MainLayout;
