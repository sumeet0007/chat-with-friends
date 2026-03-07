"use client";

import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { Search, UserPlus, Check, X, Users2, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActionTooltip } from "@/components/action-tooltip";
import { useSocket } from "@/components/providers/socket-provider";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export const FriendsComponent = ({
    profileId,
    initialFriends = [],
    initialRequests = []
}: {
    profileId: string;
    initialFriends?: any[];
    initialRequests?: any[];
}) => {
    const { socket } = useSocket();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [friends, setFriends] = useState(initialFriends);
    const [requests, setRequests] = useState(initialRequests);
    const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "ADD">("ALL");
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (!socket) return;

        const requestsKey = `user:${profileId}:requests`;
        const friendsKey = `user:${profileId}:friends`;

        socket.on(requestsKey, (data: any) => {
            if (data.action === "request_processed") {
                setRequests((prev) => prev.filter((r) => r.id !== data.requestId));
            } else {
                setRequests((prev) => [data, ...prev]);
            }
            router.refresh();
        });

        socket.on(friendsKey, () => {
            // Re-fetch friends or simply refresh router to get updated server-side props
            // For immediate local update, refresh is easiest and cleanest as it handles sidebar too
            router.refresh();
        });

        return () => {
            socket.off(requestsKey);
            socket.off(friendsKey);
        };
    }, [socket, profileId, router]);

    // Handle prop updates from server-side re-fetching (router.refresh)
    useEffect(() => {
        setFriends(initialFriends);
        setRequests(initialRequests);
    }, [initialFriends, initialRequests]);

    useEffect(() => {
        if (activeTab === "ADD" && searchQuery.length > 2) {
            const delayDebounceFn = setTimeout(() => {
                searchUsers(searchQuery);
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchQuery, activeTab]);

    const searchUsers = async (query: string) => {
        setIsLoading(true);
        try {
            const res = await axios.get(`/api/users/search?q=${query}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendRequest = async (receiverId: string) => {
        try {
            await axios.post("/api/socket/friend-requests", { receiverId });
            // Update UI optimistically
            setSearchResults(prev => prev.map(user =>
                user.id === receiverId ? { ...user, hasSentRequest: true } : user
            ));
        } catch (error) {
            console.error(error);
        }
    };

    const respondToRequest = async (requestId: string, action: "accept" | "reject") => {
        try {
            await axios.post("/api/socket/friend-responses", { requestId, action });

            // UI will update via socket listener automatically, 
            // but we can also do it optimistically for better feel
            setRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (error) {
            console.error(error);
        }
    };

    const dmFriend = async (friendId: string) => {
        try {
            const res = await axios.post("/api/friends/dm", { friendId });
            router.push(`/friends/conversations/${res.data.memberId}`);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex-1 flex flex-col w-full h-full text-black dark:text-white overflow-hidden">
            {/* Nav Tabs */}
            <div className="flex items-center gap-x-4 p-4 border-b border-zinc-200 dark:border-neutral-800">
                <Users2 className="h-6 w-6 text-zinc-500" />
                <h2 className="font-semibold text-md text-zinc-700 dark:text-zinc-200">Friends</h2>
                <div className="h-6 w-[1px] bg-zinc-300 dark:bg-zinc-700 mx-2" />
                <button
                    onClick={() => setActiveTab("ALL")}
                    className={`px-2 py-1 rounded-md text-sm font-medium transition ${activeTab === "ALL" ? "bg-zinc-200 dark:bg-zinc-700" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
                >
                    All
                </button>
                <button
                    onClick={() => setActiveTab("PENDING")}
                    className={`px-2 py-1 rounded-md text-sm font-medium transition ${activeTab === "PENDING" ? "bg-zinc-200 dark:bg-zinc-700" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
                >
                    Pending
                    {requests.length > 0 && (
                        <span className="ml-2 bg-rose-500 text-white text-xs rounded-full px-1.5 py-0.5">
                            {requests.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("ADD")}
                    className={`px-2 py-1 rounded-md text-sm font-medium transition ${activeTab === "ADD" ? "bg-emerald-500 text-white" : "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"}`}
                >
                    Add Friend
                </button>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 p-4 md:p-6 p-4">
                {activeTab === "ADD" && (
                    <div className="max-w-3xl mx-auto space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold">ADD FRIEND</h2>
                            <p className="text-sm text-zinc-500">You can add friends with their email or name.</p>
                            <div className="relative group/search">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-focus-within/search:text-indigo-400 transition-colors" />
                                <Input
                                    className="pl-9 bg-[#E3E5E8] dark:bg-[#1E1F22] border-transparent focus:border-indigo-500/50 focus-visible:ring-0 focus-visible:ring-offset-0 ring-offset-0 py-6 transition-all rounded-xl shadow-inner dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                                    placeholder="Enter email or name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-8 space-y-2">
                            {isLoading && <p className="text-zinc-500 mt-4 text-center animate-pulse">Scanning network...</p>}
                            <AnimatePresence>
                                {!isLoading && searchResults.length > 0 && searchResults.map((user, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                                        key={user.id}
                                        className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-indigo-500/20 hover:bg-zinc-100 hover:shadow-[0_0_15px_rgba(79,70,229,0.1)] dark:hover:bg-[#2B2D31]/80 group transition-all"
                                    >
                                        <div className="flex items-center gap-x-3">
                                            <UserAvatar src={user.imageUrl} className="h-10 w-10 md:h-10 md:w-10 group-hover:scale-105 transition-transform" />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-md tracking-tight">{user.name}</span>
                                            </div>
                                        </div>
                                        <div>
                                            {user.isFriend ? (
                                                <span className="text-sm text-emerald-500 font-semibold px-3 bg-emerald-500/10 py-1 rounded-full">Friend</span>
                                            ) : user.hasSentRequest ? (
                                                <span className="text-sm text-zinc-500 font-semibold px-3 bg-zinc-500/10 py-1 rounded-full">Request Sent</span>
                                            ) : user.hasReceivedRequest ? (
                                                <span className="text-sm text-indigo-500 font-semibold px-3 bg-indigo-500/10 py-1 rounded-full drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">Pending</span>
                                            ) : (
                                                <ActionTooltip label="Send Friend Request">
                                                    <Button size="icon" variant="ghost" onClick={() => sendRequest(user.id)} className="rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] group-hover:bg-indigo-500 group-hover:text-white">
                                                        <UserPlus className="h-4 w-4" />
                                                    </Button>
                                                </ActionTooltip>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {!isLoading && searchQuery.length > 2 && searchResults.length === 0 && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-zinc-500 text-center py-4">No connections found for &#34;{searchQuery}&#34;</motion.p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "PENDING" && (
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 mb-4 px-2">Pending Requests — {requests.length}</h2>
                        <AnimatePresence>
                            {requests.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-48 text-zinc-500">
                                    <p className="opacity-70">No pending friend requests</p>
                                </motion.div>
                            ) : (
                                requests.map((req, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={req.id}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#2B2D31]/80 group transition border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-x-3">
                                            <UserAvatar src={req.sender.imageUrl} className="h-10 w-10 md:h-10 md:w-10 group-hover:scale-105 transition-transform" />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-md tracking-tight">{req.sender.name}</span>
                                                <span className="text-xs text-zinc-500 uppercase font-semibold">Incoming Request</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-x-2">
                                            <ActionTooltip label="Accept">
                                                <Button size="icon" variant="ghost" className="h-9 w-9 bg-zinc-200 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white rounded-full transition-all hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]" onClick={() => respondToRequest(req.id, "accept")}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </ActionTooltip>
                                            <ActionTooltip label="Ignore">
                                                <Button size="icon" variant="ghost" className="h-9 w-9 bg-zinc-200 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white rounded-full transition-all hover:shadow-[0_0_10px_rgba(244,63,94,0.5)]" onClick={() => respondToRequest(req.id, "reject")}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </ActionTooltip>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {activeTab === "ALL" && (
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 mb-4 px-2">All Friends — {friends.length}</h2>
                        <AnimatePresence>
                            {friends.length === 0 ? (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-8 mt-10">
                                    <motion.div animate={{ rotate: [0, 2, -2, 0], y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 6 }}>
                                        <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDBscHFjZ2cyeGQwdHl5Mzl6emhpcnRxbWxtOXU3bXZwdnd5NGtkayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26vUxJ9rqfwuIEkTu/giphy.gif" alt="empty grid" className="h-48 w-48 mb-6 rounded-full opacity-60 mix-blend-screen" />
                                    </motion.div>
                                    <p className="text-zinc-500 text-lg font-medium drop-shadow-sm">You have no friends yet.</p>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button onClick={() => setActiveTab("ADD")} className="mt-8 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 text-white rounded-full px-8 font-bold border-none shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                                            Find Connections
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <div className="space-y-1 mt-2">
                                    {friends.map((f, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            key={f.id}
                                            className="flex items-center justify-between p-3 border border-transparent hover:border-indigo-500/20 hover:bg-zinc-100 dark:hover:bg-[#2B2D31]/80 hover:shadow-[0_0_15px_rgba(79,70,229,0.05)] group transition-all rounded-xl"
                                        >
                                            <div className="flex items-center gap-x-3 relative">
                                                <div className="relative">
                                                    <UserAvatar src={f.friend.imageUrl} className="h-10 w-10 md:h-10 md:w-10 group-hover:scale-105 transition-transform" />
                                                    {/* Futuristic status indicator */}
                                                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#313338] shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-md tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-cyan-400 transition-all">{f.friend.name}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-x-2">
                                                <ActionTooltip label="Message">
                                                    <Button size="icon" variant="ghost" className="h-9 w-9 bg-zinc-200 dark:bg-zinc-800 hover:bg-indigo-500 hover:text-white rounded-full transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.6)] group/btn" onClick={() => dmFriend(f.friend.id)}>
                                                        <MessageCircle className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                                    </Button>
                                                </ActionTooltip>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
