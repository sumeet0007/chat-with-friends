"use client";

import { Menu } from "lucide-react";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const MobileToggle = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 flex flex-row gap-0 border-none">
                <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
                <SheetDescription className="sr-only">
                    Access servers and channels on mobile devices.
                </SheetDescription>
                {children}
            </SheetContent>
        </Sheet>
    )
}
