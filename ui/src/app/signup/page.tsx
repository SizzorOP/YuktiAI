"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";

const experienceOptions = [
    { value: "less_than_1", label: "Less than 1 year" },
    { value: "1_to_3", label: "1 to 3 years" },
    { value: "3_to_5", label: "3 to 5 years" },
    { value: "5_plus", label: "5+ years" },
];

export default function SignupPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<"professional" | "student" | "">("");
    const [experience, setExperience] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (!role) {
            setError("Please select whether you are a professional or student.");
            return;
        }
        if (!experience) {
            setError("Please select your experience level.");
            return;
        }

        setLoading(true);

        // 1. Sign up with Supabase Auth
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    full_name: fullName,
                    role,
                    experience,
                    phone,
                },
            },
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        // 2. Insert profile row
        if (data.user) {
            await supabase.from("profiles").insert({
                id: data.user.id,
                full_name: fullName,
                role,
                experience,
                phone: phone || null,
            });
        }

        // 3. Redirect to verify email page
        router.push("/verify-email");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-blue-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 px-4 py-12">
            <div className="w-full max-w-[480px]">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 dark:bg-white rounded-2xl mb-4 shadow-lg">
                        <div className="relative w-full h-full">
                            <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 bg-white dark:bg-zinc-900 rounded-sm" />
                            <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 bg-zinc-400 rounded-sm" />
                            <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-white dark:bg-zinc-900 rounded-full" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-serif tracking-tight">Create your account</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Get started with YuktiAI in seconds</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSignup} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">I am a</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(["professional", "student"] as const).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`relative px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${role === r
                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                                        }`}
                                >
                                    {role === r && <Check className="w-3.5 h-3.5 absolute top-2 right-2 text-blue-500" />}
                                    {r === "professional" ? "Professional" : "Student"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Experience Level */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Experience</label>
                        <div className="grid grid-cols-2 gap-3">
                            {experienceOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setExperience(opt.value)}
                                    className={`relative px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${experience === opt.value
                                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                                        }`}
                                >
                                    {experience === opt.value && <Check className="w-3.5 h-3.5 absolute top-2 right-2 text-blue-500" />}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all pr-11"
                                placeholder="Minimum 6 characters"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all pr-11"
                                placeholder="Re-enter your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-900 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {loading ? "Creating account..." : "Create account"}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-8">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
