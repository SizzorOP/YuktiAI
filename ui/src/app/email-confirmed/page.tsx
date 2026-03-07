"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function EmailConfirmedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-blue-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 px-4">
            <div className="w-full max-w-[420px] text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
                    <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-serif tracking-tight mb-3">Congratulations!</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                    Your email has been successfully verified. You can now access your YuktiAI account.
                </p>

                <Link
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-900 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                    Sign in to your account <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
