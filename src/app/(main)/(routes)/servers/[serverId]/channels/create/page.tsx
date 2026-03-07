"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChannelType } from "@prisma/client";
import qs from "query-string";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Hash, Mic, Video, ArrowLeft } from "lucide-react";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
    name: z.string().min(1, {
        message: "Channel name is required."
    }).refine(
        name => name !== "general",
        {
            message: "Channel name cannot be 'general'"
        }
    ),
    type: z.nativeEnum(ChannelType)
});

const CreateChannelPage = () => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const channelTypeParam = searchParams?.get("channelType");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: (channelTypeParam as ChannelType) || ChannelType.TEXT,
        }
    });

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const url = qs.stringifyUrl({
                url: "/api/channels",
                query: {
                    serverId: params?.serverId
                }
            });
            await axios.post(url, values);

            form.reset();
            router.push(`/servers/${params?.serverId}`);
            router.refresh();
        } catch (error) {
            console.log(error);
        }
    }

    if (!isMounted) return null;

    return (
        <div className="flex items-center justify-center p-4 md:p-8 h-full bg-[#F2F3F5] dark:bg-[#313338] w-full mt-12 md:mt-0">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-[#2B2D31] rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg p-8"
            >
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.push(`/servers/${params?.serverId}`)}
                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition group flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Back</span>
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-400 tracking-tight mb-2">
                        Create Channel
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Create a new channel to collaborate with your team.
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                        Channel Type
                                    </FormLabel>
                                    <FormControl>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {[
                                                { id: ChannelType.TEXT, icon: Hash, label: "Text", desc: "Send messages, images, GIFs, emoji, opinions, and puns" },
                                                { id: ChannelType.AUDIO, icon: Mic, label: "Voice", desc: "Hang out together with voice, video, and screen share" },
                                                { id: ChannelType.VIDEO, icon: Video, label: "Video", desc: "Live video and screen sharing" }
                                            ].map(({ id, icon: Icon, label, desc }) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => field.onChange(id)}
                                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${field.value === id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                                >
                                                    <Icon className={`w-8 h-8 mb-2 ${field.value === id ? 'text-indigo-500' : 'text-zinc-500 dark:text-zinc-400'}`} />
                                                    <span className={`font-semibold ${field.value === id ? 'text-indigo-700 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                        {label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                        Channel name
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Hash className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <Input
                                                disabled={isLoading}
                                                className="pl-10 h-14 bg-zinc-100 dark:bg-zinc-900 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-black dark:text-white rounded-xl text-lg transition-all shadow-inner"
                                                placeholder="new-channel"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-4">
                            <Button
                                variant="default"
                                disabled={isLoading}
                                className="w-full h-12 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-lg hover:opacity-90 border-none rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
                            >
                                {isLoading ? "Creating..." : "Create Channel"}
                            </Button>
                        </motion.div>
                    </form>
                </Form>
            </motion.div>
        </div>
    );
}

export default CreateChannelPage;
