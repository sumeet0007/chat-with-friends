export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#0F1014] selection:bg-indigo-500/30">
            {/* Left side: Branding (Hidden on mobile/tablet) */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-[#0A0B0E] border-r border-white/5">
                {/* Background effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-[10%] -left-[10%] h-[70%] w-[70%] rounded-full bg-indigo-600/10 blur-[120px]" />
                    <div className="absolute bottom-[0%] right-[0%] h-[50%] w-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
                    <div className="absolute top-[40%] left-[30%] h-[30%] w-[30%] rounded-full bg-blue-600/5 blur-[100px] animate-pulse" />
                    <div className="absolute z-0 inset-0 bg-[url('/bg-pattern.svg')] bg-center opacity-5 mix-blend-overlay" />
                </div>

                <div className="relative z-10 flex items-center gap-x-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <div className="h-4 w-4 rounded-full bg-white animate-pulse" />
                    </div>
                    <span className="text-3xl font-black tracking-tight text-white font-space-grotesk">
                        PULSE
                    </span>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg mb-20">
                    <h1 className="text-5xl font-bold font-space-grotesk leading-[1.1] text-white">
                        Connect with your universe, <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">instantly.</span>
                    </h1>
                    <p className="text-lg text-zinc-400 leading-relaxed font-medium">
                        Welcome to the next generation of real-time communication. Crystal clear voice, seamless video, and blazing fast chat.
                    </p>
                </div>
                
                <div className="relative z-10 flex items-center gap-x-2 text-sm text-zinc-500 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> 
                    All systems operational
                </div>
            </div>

            {/* Right side: Auth forms */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center relative">
                {/* Show logo only on mobile/tablet */}
                <div className="absolute top-8 left-8 flex lg:hidden items-center gap-x-2 z-50">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                    </div>
                    <span className="text-2xl font-black tracking-tight text-white font-space-grotesk">
                        PULSE
                    </span>
                </div>
                
                {/* Form wrapper */}
                <div className="w-full max-w-md p-8 relative z-10 flex flex-col items-center">
                    {children}
                </div>
            </div>
        </div>
    );
}
