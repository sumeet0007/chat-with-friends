import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Page() {
    return (
        <SignIn
            appearance={{
                baseTheme: dark,
                elements: {
                    rootBox: "w-full",
                    cardBox: "w-full shadow-none border-none rounded-none outline-none",
                    card: "bg-transparent border-none shadow-none w-full flex flex-col justify-center p-0 outline-none",
                    headerTitle: "text-white font-space-grotesk text-4xl font-bold pt-4",
                    headerSubtitle: "text-zinc-400 text-base mt-2",
                    socialButtonsBlockButton: "border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-white transition-all h-12 shadow-sm",
                    socialButtonsBlockButtonText: "font-semibold text-zinc-200",
                    formFieldLabel: "text-zinc-400 uppercase text-xs font-bold tracking-wider",
                    formFieldInput: "bg-[#0A0B0E] border border-zinc-800 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-12 transition-all rounded-lg",
                    formButtonPrimary: "bg-indigo-500 hover:bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.2)] text-white text-md font-bold transition-all h-12 rounded-lg mt-2",
                    footerActionLink: "text-indigo-400 hover:text-indigo-300 font-semibold",
                    dividerLine: "bg-zinc-800",
                    dividerText: "text-zinc-500 text-xs font-medium",
                    identityPreviewText: "text-zinc-300",
                    identityPreviewEditButton: "text-indigo-400 hover:text-indigo-300",
                    formFieldLabelRow: "text-zinc-300",
                    footerActionText: "text-zinc-400",
                    footer: "hidden", 
                }
            }}
        />
    );
}
