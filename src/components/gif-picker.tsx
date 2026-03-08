"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Search, Loader2, Sparkles, Ghost, AlertCircle, X } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GifPickerProps {
    onChange: (url: string) => void;
}

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "dc6zaTOxFJmzC";

export const GifPicker = ({
    onChange
}: GifPickerProps) => {
    const [search, setSearch] = useState("");
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [type, setType] = useState<"gifs" | "stickers">("gifs");

    const [open, setOpen] = useState(false);

    const fetchGifs = async (query: string = "") => {
        setIsLoading(true);
        setIsError(false);
        try {
            const endpoint = query ? `search` : `trending`;
            const baseUrl = `https://api.giphy.com/v1/${type}/${endpoint}`;

            const params: Record<string, string | number> = {
                api_key: GIPHY_API_KEY,
                limit: 30, // Increased limit for better density
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

    const handleClearSearch = () => {
        setSearch("");
    };

    const handleSelect = (url: string) => {
        onChange(url);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="h-[24px] w-[24px] flex items-center justify-center hover:scale-110 transition-all duration-200 group relative"
                >
                    <Sparkles className="text-zinc-500 dark:text-zinc-400 h-5 w-5 group-hover:text-amber-500 transition-colors" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                        GIFs & Stickers
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                sideOffset={40}
                className="bg-white dark:bg-[#2B2D31] border-none shadow-2xl w-[400px] p-0 overflow-hidden rounded-xl animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="p-4 bg-[#F2F3F5] dark:bg-[#1E1F22] border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-y-3">
                    <div className="flex bg-zinc-200/50 dark:bg-black/20 rounded-lg p-1">
                        <button
                            onClick={() => setType("gifs")}
                            className={cn(
                                "flex-1 text-xs py-1.5 rounded-md transition-all duration-200",
                                type === 'gifs' 
                                    ? 'bg-white dark:bg-zinc-700 shadow-sm font-bold text-indigo-500 dark:text-white' 
                                    : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                            )}
                        >
                            GIFs
                        </button>
                        <button
                            onClick={() => setType("stickers")}
                            className={cn(
                                "flex-1 text-xs py-1.5 rounded-md transition-all duration-200",
                                type === 'stickers' 
                                    ? 'bg-white dark:bg-zinc-700 shadow-sm font-bold text-indigo-500 dark:text-white' 
                                    : 'text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                            )}
                        >
                            Stickers
                        </button>
                    </div>
                    <div className="relative group items-center">
                        <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search GIPHY ${type}...`}
                            className="pl-9 pr-9 bg-white dark:bg-[#383A40] border-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-sm h-10 rounded-md placeholder:text-zinc-500 shadow-inner w-full"
                        />
                        {search && (
                            <button 
                                onClick={handleClearSearch}
                                className="absolute right-3 inset-y-0 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="h-[400px] overflow-y-auto px-4 py-4 custom-scrollbar bg-white dark:bg-[#2B2D31]">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-y-3 opacity-60">
                            <div className="relative">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                                <Sparkles className="h-4 w-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                            </div>
                            <p className="text-sm font-semibold text-zinc-500">Searching the GIPHY galaxy...</p>
                        </div>
                    ) : isError ? (
                        <div className="h-full flex flex-col items-center justify-center gap-y-3 p-10 text-center">
                            <div className="bg-rose-100 dark:bg-rose-900/30 p-4 rounded-full">
                                <AlertCircle className="h-10 w-10 text-rose-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">API Key Error (403)</p>
                                <p className="text-xs text-zinc-500 mt-2 max-w-[200px]">
                                    The public GIPHY key is restricted. Add your own key to .env for best results.
                                </p>
                            </div>
                            <a
                                href="https://developers.giphy.com/dashboard/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-white bg-indigo-500 px-4 py-2 rounded-md hover:bg-indigo-600 transition shadow-md"
                            >
                                Get a free key
                            </a>
                        </div>
                    ) : data.length > 0 ? (
                        <div className="columns-2 gap-2 space-y-2">
                            {data.map((gif) => (
                                <button
                                    key={gif.id}
                                    onClick={() => handleSelect(gif.images.original.url)}
                                    className="relative break-inside-avoid w-full group cursor-pointer overflow-hidden rounded-lg bg-zinc-100 dark:bg-[#1E1F22] hover:ring-2 hover:ring-indigo-500 transition-all duration-200"
                                >
                                    <img
                                        src={gif.images.fixed_width.url}
                                        alt={gif.title}
                                        className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-y-3 opacity-60 p-10 text-center">
                            <div className="bg-zinc-100 dark:bg-[#1E1F22] p-4 rounded-full">
                                <Ghost className="h-10 w-10 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Nothing here...</p>
                                <p className="text-xs text-zinc-500">Try a different vibe or search term!</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-4 py-2 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-[#F2F3F5] dark:bg-[#1E1F22]">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">GIPHY</span>
                    <div className="flex gap-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse delay-75" />
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse delay-150" />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
