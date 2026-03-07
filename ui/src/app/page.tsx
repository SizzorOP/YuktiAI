"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useCallback } from "react";
import {
    Download,
    Briefcase,
    Search,
    PenTool,
    Headphones,
    CalendarDays,
    BookOpen,
    ExternalLink,
    Languages,
    RefreshCw,
    Clock,
    Loader2,
    PanelRightClose,
    PanelRightOpen,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
interface NewsItem {
    id: string;
    title: string;
    summary: string;
    date: string;
    link: string;
    image: string;
    analysePrompt: string;
}

// ─── Quick Prompts Data ─────────────────────────────────────────────────
const quickPrompts = [
    { title: "Create Case", icon: Briefcase, desc: "Everything about your case, organised in one place, so nothing slips through the cracks.", href: "/cases" },
    { title: "Start your Research", icon: Search, desc: "Search case law or upload documents and get clear, relevant answers without delay.", href: "/research" },
    { title: "Draft Documents", icon: PenTool, desc: "Describe what you need in plain language and receive a strong first draft to refine.", href: "/drafting" },
    { title: "Translate Document", icon: Languages, desc: "Translate documents accurately while preserving the exact legal language.", href: "/translation" },
    { title: "Summarise Meeting", icon: Headphones, desc: "Long meeting or call? Instantly extract key points, summaries, and action items.", href: "/meeting" },
    { title: "Add Event", icon: CalendarDays, desc: "Hearing or deadline approaching? Add it once and get timely reminders automatically.", href: "/calendar" },
    { title: "Browse Legal Library", icon: BookOpen, desc: "Find relevant acts, statutes, and judgments quickly without endless back and forth.", href: "/library" },
];

export default function DashboardPage() {
    const router = useRouter();
    const { profile } = useAuth();
    const displayName = profile?.full_name || "User";

    const [isQuickPromptsOpen, setIsQuickPromptsOpen] = useState(true);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [newsSource, setNewsSource] = useState("");
    const [lastUpdated, setLastUpdated] = useState("");
    const [nextUpdate, setNextUpdate] = useState("");

    const fetchNews = useCallback(async () => {
        setNewsLoading(true);
        try {
            const res = await fetch("/api/news");
            if (!res.ok) throw new Error("Failed to fetch news");
            const data = await res.json();
            setNewsItems(data.news || []);
            setNewsSource(data.source || "unknown");
            setLastUpdated(data.lastUpdated || "");
            setNextUpdate(data.nextUpdate || "");
        } catch {
            // If API fails, keep existing news if any
            console.error("Failed to load news");
        } finally {
            setNewsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();

        // Auto‑refresh every 4 hours
        const interval = setInterval(fetchNews, 4 * 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchNews]);

    const handleAnalyseLegally = (prompt: string) => {
        const encodedPrompt = encodeURIComponent(prompt);
        router.push(`/research?prompt=${encodedPrompt}`);
    };

    const formatTimeAgo = (iso: string) => {
        if (!iso) return "";
        try {
            const diff = Date.now() - new Date(iso).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return "just now";
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            return `${Math.floor(hrs / 24)}d ago`;
        } catch { return ""; }
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] md:h-screen bg-white">
            {/* Center Scrollable Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200">
                {/* Header Area */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-6 md:px-8 md:py-10 border-b border-zinc-100/50 gap-4 sm:gap-0">
                    <div>
                        <h1 className="text-2xl md:text-[28px] font-semibold text-zinc-900 font-serif tracking-tight mb-2">
                            Welcome {displayName}
                        </h1>
                        <p className="text-[13px] text-zinc-500 font-medium">Last worked on</p>
                    </div>
                </div>

                {/* Main Content Areas */}
                <div className="p-4 md:p-8 w-full max-w-5xl mx-auto space-y-6">

                    {/* Case Management Card */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
                            <h2 className="text-[16px] font-bold text-zinc-900 font-serif tracking-tight">Case Management</h2>
                            <Briefcase className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="p-10 md:p-16 flex flex-col items-center justify-center">
                            <p className="text-[13px] text-zinc-400 mb-6">No cases found</p>
                            <Link
                                href="/cases"
                                className="text-[13px] font-semibold text-zinc-900 hover:text-blue-600 transition-colors"
                            >
                                Create Case
                            </Link>
                        </div>
                    </div>

                    {/* ─── News in Spotlight (Live) ──────────────────────────────── */}
                    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between px-4 py-4 md:px-6 border-b border-[#e5e7eb]">
                            <div className="flex items-center gap-2 md:gap-3">
                                <h2 className="text-[15px] md:text-[16px] font-bold text-zinc-900 font-serif tracking-tight">News in Spotlight</h2>
                                {newsSource === "live" && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full uppercase tracking-wide">Live</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                {lastUpdated && (
                                    <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                                        <Clock className="w-3 h-3" />
                                        Updated {formatTimeAgo(lastUpdated)}
                                    </span>
                                )}
                                <button
                                    onClick={fetchNews}
                                    disabled={newsLoading}
                                    className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
                                    title="Refresh news"
                                >
                                    <RefreshCw className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {newsLoading && newsItems.length === 0 ? (
                            <div className="p-16 flex flex-col items-center justify-center">
                                <Loader2 className="w-6 h-6 text-zinc-300 animate-spin mb-3" />
                                <p className="text-[13px] text-zinc-400">Loading latest legal news...</p>
                            </div>
                        ) : (
                            <div
                                className="grid gap-4 md:gap-6 p-4 md:p-6 bg-zinc-50/30"
                                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" }}
                            >
                                {newsItems.map((news) => (
                                    <div key={news.id} className="p-4 flex flex-col sm:flex-row gap-4 md:gap-5 group bg-white border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-xl hover:shadow-md transition-all">
                                        {/* News Thumbnail */}
                                        <div className="w-full sm:w-[140px] 2xl:w-[180px] h-48 sm:h-auto rounded-xl overflow-hidden flex-shrink-0 bg-zinc-100">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={news.image}
                                                alt={news.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* News Content */}
                                        <div className="flex-1 flex flex-col justify-between min-w-0">
                                            <div>
                                                <h3 className="text-[15px] font-bold text-zinc-900 mb-3 leading-snug">
                                                    {news.title}
                                                </h3>
                                                <p className="text-[13px] text-zinc-500 leading-relaxed mb-3">
                                                    {news.summary}
                                                </p>
                                                {news.link && news.link !== "#" && (
                                                    <a
                                                        href={news.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[13px] font-semibold text-blue-700 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
                                                    >
                                                        Read more
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                                {(!news.link || news.link === "#") && (
                                                    <span className="text-[13px] font-semibold text-blue-700 opacity-50">
                                                        Read more
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between pt-4 mt-auto gap-3">
                                                <span className="text-[12px] text-zinc-400 font-medium">{news.date}</span>
                                                <button
                                                    onClick={() => handleAnalyseLegally(news.analysePrompt)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-black text-white text-[12px] font-semibold rounded-lg transition-all shadow-sm group-hover:shadow-md"
                                                >
                                                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                                                    <span>Analyse Legally</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Right Sidebar for Quick Prompts */}
            <div className={`transition-all duration-300 bg-white border-t md:border-l md:border-t-0 border-zinc-100 flex-shrink-0 h-auto md:h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 ${isQuickPromptsOpen ? 'w-full md:w-[300px] xl:w-[320px] px-4 py-8 md:px-6' : 'w-full md:w-[68px] px-4 py-8 md:px-2 flex flex-col items-center'}`}>
                <div className={`flex items-center ${isQuickPromptsOpen ? 'justify-between' : 'justify-between md:justify-center'} mb-6 mt-2 w-full`}>
                    <h3 className={`font-serif text-[18px] font-semibold text-zinc-900 tracking-tight ${!isQuickPromptsOpen ? 'md:hidden' : ''}`}>
                        Quick Prompts
                    </h3>
                    <button
                        onClick={() => setIsQuickPromptsOpen(!isQuickPromptsOpen)}
                        className="text-zinc-500 hover:text-zinc-900 transition-colors p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 flex-shrink-0"
                        title={isQuickPromptsOpen ? "Collapse Prompts" : "Expand Prompts"}
                    >
                        {isQuickPromptsOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                    </button>
                </div>
                {isQuickPromptsOpen && (
                    <div className="space-y-4 w-full">
                        {quickPrompts.map((prompt, idx) => (
                            <Link
                                key={idx}
                                href={prompt.href}
                                className="block p-[18px] bg-white border border-[#e5e7eb] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-zinc-300 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50/50 flex items-center justify-center text-blue-800">
                                            <prompt.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                                        </div>
                                        <h4 className="text-[14px] font-bold text-zinc-900 group-hover:text-blue-700 transition-colors">{prompt.title}</h4>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                                </div>
                                <p className="text-[13px] text-zinc-500 leading-relaxed pr-2">
                                    {prompt.desc}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
