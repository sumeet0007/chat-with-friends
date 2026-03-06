import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModalProvider } from "@/components/providers/modal-provider";
import { NotificationHandler } from "@/components/notification-handler";
import { SocketProvider } from "@/components/providers/socket-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Discord Clone",
  description: "A functional Discord clone built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body
          className={`${inter.className} bg-discord-bg text-discord-text antialiased h-full`}
        >
          <SocketProvider>
            <QueryProvider>
              <TooltipProvider>
                <ModalProvider />
                <NotificationHandler />
                {children}
              </TooltipProvider>
            </QueryProvider>
          </SocketProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
