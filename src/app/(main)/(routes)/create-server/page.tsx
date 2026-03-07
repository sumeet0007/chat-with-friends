"use client";

import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MonitorSmartphone } from "lucide-react";

import { FileUpload } from "@/components/file-upload";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
    name: z.string().min(1, {
        message: "Server name is required.",
    }),
    imageUrl: z.string().optional(),
});

const CreateServerPage = () => {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            imageUrl: "",
        },
    });

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await axios.post("/api/servers", values);

            form.reset();
            router.push("/");
            router.refresh();
        } catch (error) {
            console.log(error);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="flex items-center justify-center p-4 md:p-8 h-full bg-[#F2F3F5] dark:bg-[#313338] w-full mt-12 md:mt-0">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-[#2B2D31] rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg p-8"
            >
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition group flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Back</span>
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 tracking-tight mb-2 flex items-center justify-center gap-3">
                        <MonitorSmartphone className="text-indigo-500 w-8 h-8" />
                        Customize your server
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        Give your new server a personality with a name and an image. You can always change it later.
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="flex items-center justify-center text-center">
                            <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <FileUpload
                                                endpoint="serverImage"
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                        Server Name
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            disabled={isLoading}
                                            className="px-4 h-14 bg-zinc-100 dark:bg-zinc-900 border-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-black dark:text-white rounded-xl text-lg transition-all shadow-inner"
                                            placeholder="Enter server name"
                                            {...field}
                                        />
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
                                {isLoading ? "Creating..." : "Create Server"}
                            </Button>
                        </motion.div>
                    </form>
                </Form>
            </motion.div>
        </div>
    );
};

export default CreateServerPage;
