"use client";

import axios from "axios";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Label } from "@/components/ui/label";
import { useModal } from "@/hooks/use-modal-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/modal";

export const InviteModal = () => {
    const { onOpen, isOpen, onClose, type, data } = useModal();

    const isModalOpen = isOpen && type === "invite";
    const { server } = data;

    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    const inviteUrl = `${origin}/invite/${server?.inviteCode}`;

    const onCopy = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 1000);
    };

    const onNewLink = async () => {
        try {
            setIsLoading(true);
            const response = await axios.patch(`/api/servers/${server?.id}/invite-code`);

            onOpen("invite", { server: response.data });
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Modal
            title="Invite Friends"
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <div className="p-6">
                <Label
                    className="uppercase text-xs font-bold text-zinc-500 dark:text-zinc-400"
                >
                    Server invite link
                </Label>
                <div className="flex items-center mt-2 gap-x-2">
                    <Input
                        disabled={isLoading}
                        className="bg-zinc-300/50 dark:bg-zinc-700/50 border-0 focus-visible:ring-0 text-black dark:text-[#DBDEE1] focus-visible:ring-offset-0"
                        value={inviteUrl}
                        readOnly
                    />
                    <Button
                        disabled={isLoading}
                        onClick={onCopy}
                        size="icon"
                        className="bg-indigo-500 text-white hover:bg-indigo-600 transition"
                    >
                        {copied
                            ? <Check className="w-4 h-4 text-emerald-500" />
                            : <Copy className="w-4 h-4" />
                        }
                    </Button>
                </div>
                <Button
                    onClick={onNewLink}
                    disabled={isLoading}
                    variant="link"
                    size="sm"
                    className="text-xs text-zinc-500 dark:text-zinc-400 mt-4 px-0"
                >
                    Generate a new link
                    <RefreshCw className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </Modal>
    )
}
