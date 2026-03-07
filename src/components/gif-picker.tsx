"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Search, Loader2, Sparkles, Ghost, AlertCircle } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";

interface GifPickerProps {
    onChange: (url: string) => void;
}

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "dc6zaTOxFJmzC";

export const GifPicker = ({
    onChange
}: GifPickerProps) => {
    const { resolvedTheme } = useTheme();
    const [search, setSearch] = useState("");
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [type, setType] = useState<"gifs" | "stickers">("gifs");

    const fetchGifs = async (query: string = "") => {
        setIsLoading(true);
        setIsError(false);
        try {
            const endpoint = query ? `search` : `trending`;
            const baseUrl = `https://api.giphy.com/v1/${type}/${endpoint}`;

            const params: Record<string, string | number> = {
                api_key: GIPHY_API_KEY,
                limit: 20,
                rating: "g",
            };

            if (query) {
                params.q = query;
            }

            const response = await axios.get(baseUrl, { params });
            setData(response.data.data);
        } catch (error: any) {
            console.error("Giphy fetch error:", error);
            setIsError(true);
            if (error?.response?.status === 403) {
                console.error("403 Forbidden: The Giphy API key may be invalid or rate-limited.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchGifs(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search, type]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="h-[24px] w-[24px] flex items-center justify-center hover:scale-110 transition opacity-80 hover:opacity-100"
                >
                    <Sparkles className="text-zinc-500 dark:text-zinc-400 h-5 w-5" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                sideOffset={40}
                className="bg-white dark:bg-[#1E1F22] border-none shadow-xl w-[320px] p-0 overflow-hidden rounded-xl"
            >
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-y-3">
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-md p-1">
                        <button
                            onClick={() => setType("gifs")}
                            className={`flex-1 text-xs py-1.5 rounded-sm transition ${type === 'gifs' ? 'bg-white dark:bg-zinc-800 shadow-sm font-semibold' : 'text-zinc-500'}`}
                        >
                            GIFs
                        </button>
                        <button
                            onClick={() => setType("stickers")}
                            className={`flex-1 text-xs py-1.5 rounded-sm transition ${type === 'stickers' ? 'bg-white dark:bg-zinc-800 shadow-sm font-semibold' : 'text-zinc-500'}`}
                        >
                            Stickers
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search ${type}...`}
                            className="pl-9 bg-zinc-100 dark:bg-zinc-900 border-none focus-visible:ring-0 text-sm h-9"
                        />
                    </div>
                </div>

                <div className="h-[300px] overflow-y-auto px-1 py-2 grid grid-cols-2 gap-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="col-span-2 h-full flex flex-col items-center justify-center gap-y-2 opacity-50">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="text-xs font-medium">Fetching magic...</p>
                        </div>
                    ) : isError ? (
                        <div className="col-span-2 h-full flex flex-col items-center justify-center gap-y-2 opacity-80 p-10 text-center">
                            <AlertCircle className="h-10 w-10 text-rose-500" />
                            <p className="text-sm font-medium">API Error (403)</p>
                            <p className="text-xs text-zinc-500">
                                The public Giphy key is restricted. Please add a valid key to your .env file.
                            </p>
                            <a
                                href="https://developers.giphy.com/dashboard/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-indigo-500 hover:underline mt-2"
                            >
                                Get a free key here
                            </a>
                        </div>
                    ) : data.length > 0 ? (
                        data.map((gif) => (
                            <button
                                key={gif.id}
                                onClick={() => onChange(gif.images.fixed_height.url)}
                                className="relative aspect-video group cursor-pointer overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900"
                            >
                                <img
                                    src={gif.images.fixed_height.url}
                                    alt={gif.title}
                                    className="object-cover w-full h-full hover:scale-105 transition"
                                />
                            </button>
                        ))
                    ) : (
                        <div className="col-span-2 h-full flex flex-col items-center justify-center gap-y-2 opacity-50 p-10 text-center">
                            <Ghost className="h-10 w-10" />
                            <p className="text-sm font-medium">No {type} found.</p>
                            <p className="text-xs">Try searching for something else!</p>
                        </div>
                    )}
                </div>

                <div className="p-2 text-[10px] text-zinc-400 text-center border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    Powered by GIPHY
                </div>
            </PopoverContent>
        </Popover>
    );
};
