"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { FileUpload } from "@/components/file-upload";
import { Loader2, Trash, Check } from "lucide-react";

const COLORS = [
    { name: "Default", value: null },
    { name: "Slate", value: "#334155" },
    { name: "Rose", value: "#4c0519" },
    { name: "Indigo", value: "#1e1b4b" },
    { name: "Emerald", value: "#064e3b" },
    { name: "Amber", value: "#451a03" },
    { name: "Sky", value: "#082f49" },
];

export const ChatThemeModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const router = useRouter();

    const isModalOpen = isOpen && type === "chatTheme";
    const { query } = data;
    const chatId = query?.chatId;

    const [isLoading, setIsLoading] = useState(false);
    const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

    useEffect(() => {
        if (isModalOpen && chatId) {
            const fetchTheme = async () => {
                try {
                    const response = await axios.get(`/api/chat-theme?chatId=${chatId}`);
                    if (response.data) {
                        setBackgroundColor(response.data.backgroundColor);
                        setBackgroundImage(response.data.backgroundImage);
                    }
                } catch (error) {
                    console.error(error);
                }
            };
            fetchTheme();
        }
    }, [isModalOpen, chatId]);

    const onSave = async () => {
        try {
            setIsLoading(true);
            await axios.post("/api/socket/chat-theme", {
                chatId,
                backgroundColor,
                backgroundImage,
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const onClear = () => {
        setBackgroundColor(null);
        setBackgroundImage(null);
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white dark:bg-[#313338] text-black dark:text-white p-0 overflow-hidden sm:max-w-md">
                <DialogHeader className="pt-8 px-6">
                    <DialogTitle className="text-2xl text-center font-bold">
                        Chat Theme
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-500">
                        Personalize your chat background for this conversation.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-zinc-500 dark:text-secondary/70">
                            Background Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => setBackgroundColor(color.value)}
                                    className={`
                                        w-8 h-8 rounded-full border border-zinc-300 dark:border-zinc-700 transition flex items-center justify-center
                                        ${backgroundColor === color.value ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-[#313338]' : ''}
                                    `}
                                    style={{ backgroundColor: color.value || 'transparent' }}
                                    title={color.name}
                                >
                                    {backgroundColor === color.value && (
                                        <Check className="h-4 w-4 text-white" />
                                    )}
                                    {!color.value && !backgroundColor && (
                                        <Check className="h-4 w-4 text-zinc-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-zinc-500 dark:text-secondary/70">
                            Background Image
                        </label>
                        <div className="flex items-center justify-center text-center">
                            <FileUpload
                                endpoint="serverImage"
                                value={backgroundImage || ""}
                                onChange={(url) => setBackgroundImage(url || null)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-gray-100 dark:bg-[#2B2D31] px-6 py-4 flex items-center justify-between">
                    <Button
                        disabled={isLoading}
                        onClick={onClear}
                        variant="ghost"
                        size="sm"
                    >
                        <Trash className="h-4 w-4 mr-2" />
                        Clear
                    </Button>
                    <div className="flex items-center gap-x-2">
                        <Button
                            disabled={isLoading}
                            onClick={onClose}
                            variant="ghost"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={isLoading}
                            onClick={onSave}
                            className="bg-indigo-500 text-white hover:bg-indigo-600"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
