"use client";

import { useState, useEffect } from "react";
import { PenTool, LayoutGrid, List, Filter, Plus, MessageSquare, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ChatSession {
    id: string;
    title: string;
    updatedAt: number;
    messages: any[];
}

const QUICK_DRAFTS = [
    {
        title: "Section 138 Notice",
        description: "Notice for dishonour of cheque under NI Act.",
        prompt: "Draft a legal notice for dishonour of cheque under Section 138 of the Negotiable Instruments Act. Include details for the payee, drawer, cheque number, and bank details."
    },
    {
        title: "NDA Agreement",
        description: "Standard Non-Disclosure Agreement for business.",
        prompt: "Draft a standard Mutual Non-Disclosure Agreement (NDA) between two parties. Include clauses for definition of confidential information, obligations, and term."
    },
    {
        title: "Bail Application",
        description: "Regular bail application under Section 437/439 CrPC.",
        prompt: "Draft a regular bail application under Section 439 of the CrPC for a client accused of a non-bailable offense. Mention grounds like clean record and cooperation."
    },
    {
        title: "Rent Agreement",
        description: "Residential lease agreement for 11 months.",
        prompt: "Draft a residential rent agreement for 11 months for a flat in Delhi. Include clauses for security deposit, monthly rent, and maintenance."
    }
];

const STORAGE_KEY = "lawbot_drafting_sessions";

export default function DraftingHomePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const router = useRouter();

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSessions(parsed.sort((a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt));
            } catch (e) {
                console.error("Failed to parse sessions", e);
            }
        }
    }, []);

    const filteredSessions = sessions.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="min-h-screen bg-white flex flex-col pt-16 px-8 p-4">

            {/* Header & Toolbar */}
            <div className="w-full flex items-center justify-between mb-8 max-w-[1400px] mx-auto">
                <div className="flex items-center gap-3">
                    <PenTool className="w-6 h-6 text-zinc-900" />
                    <h1 className="text-2xl font-bold font-serif text-zinc-900 tracking-tight">Drafting</h1>

                    {/* Search Bar */}
                    <div className="relative ml-4">
                        <input
                            type="text"
                            placeholder="Search drafts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-[300px] pl-4 pr-10 py-2 bg-white border border-zinc-200 rounded-full text-sm outline-none focus:border-zinc-400 transition-colors shadow-sm text-zinc-800 placeholder:text-zinc-400"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggles */}
                    <div className="flex bg-zinc-100 rounded-lg p-1 border border-zinc-200">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* New Draft Button */}
                    <Link
                        href="/drafting/new"
                        className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md active:scale-95 ml-2"
                    >
                        <Plus className="w-4 h-4" /> New Draft
                    </Link>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto w-full space-y-12 pb-20">
                
                {/* Quick Drafts Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Quick Draft Templates</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {QUICK_DRAFTS.map((draft) => (
                            <Link 
                                key={draft.title}
                                href={`/drafting/new?prompt=${encodeURIComponent(draft.prompt)}`}
                                className="group p-5 bg-white border border-zinc-100 rounded-2xl hover:border-zinc-300 hover:shadow-lg transition-all duration-300 text-left"
                            >
                                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                    <PenTool className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-zinc-900 mb-1">{draft.title}</h3>
                                <p className="text-xs text-zinc-500 leading-relaxed mb-4">{draft.description}</p>
                                <div className="flex items-center text-xs font-bold text-zinc-900 group-hover:gap-2 transition-all">
                                    Start Drafting <ArrowRight className="w-3 h-3 ml-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Recent Drafts Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Recent Activities</h2>
                    </div>
                    
                    {sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-100 rounded-3xl">
                            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="w-8 h-8 text-zinc-200" />
                            </div>
                            <p className="text-zinc-400 text-sm font-medium">No recent drafts found. Start a new one to see it here.</p>
                        </div>
                    ) : (
                        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                            {filteredSessions.map((session) => (
                                <Link
                                    key={session.id}
                                    href={`/drafting/new?sessionId=${session.id}`}
                                    className={`group bg-white border border-zinc-100 transition-all hover:border-zinc-300 hover:shadow-md
                                        ${viewMode === "grid" ? "p-5 rounded-2xl" : "p-4 rounded-xl flex items-center justify-between"}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center shrink-0">
                                            <MessageSquare className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-zinc-900 truncate max-w-[200px]">{session.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="w-3 h-3 text-zinc-400" />
                                                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                                                    Updated {formatDate(session.updatedAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {viewMode === "list" && (
                                        <div className="p-2 rounded-full bg-zinc-50 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>

        </div>
    );
}
