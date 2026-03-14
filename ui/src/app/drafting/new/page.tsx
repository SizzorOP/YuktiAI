"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import {
    Send,
    Loader2,
    PenTool,
    ArrowLeft,
    Share2,
    Download,
    Copy,
    Check
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ChatHistorySidebar, ChatSession } from "@/components/ChatHistorySidebar";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    metadata?: {
        generated_template?: string;
        detected_draft_type?: string;
    };
}

const STORAGE_KEY = "lawbot_drafting_sessions";
const ACTIVE_SESSION_KEY = "lawbot_active_draft_session";

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text', err);
        }
    };
    return (
        <button 
            onClick={handleCopy}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-md transition-all active:scale-95"
            title="Copy draft"
        >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
    );
}

function DraftingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionIdParam = searchParams.get("sessionId");
    const promptParam = searchParams.get("prompt");

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const savedSessions = localStorage.getItem(STORAGE_KEY);
        let sessionsList: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];
        setSessions(sessionsList);

        if (sessionIdParam) {
            const session = sessionsList.find(s => s.id === sessionIdParam);
            if (session) {
                setActiveSessionId(sessionIdParam);
                setMessages(session.messages || []);
                localStorage.setItem(ACTIVE_SESSION_KEY, sessionIdParam);
            } else {
                createNewSession(promptParam || "");
            }
        } else if (promptParam) {
            createNewSession(promptParam);
        } else {
            const lastActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
            const lastSession = sessionsList.find(s => s.id === lastActiveId);
            if (lastSession) {
                setActiveSessionId(lastActiveId);
                setMessages(lastSession.messages || []);
            } else if (sessionsList.length > 0) {
                const first = sessionsList[0];
                setActiveSessionId(first.id);
                setMessages(first.messages || []);
                localStorage.setItem(ACTIVE_SESSION_KEY, first.id);
            } else {
                createNewSession();
            }
        }
    }, [sessionIdParam, promptParam]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        }
    }, [sessions]);

    const createNewSession = (initialPrompt?: string) => {
        const newId = crypto.randomUUID();
        const newSession: ChatSession = {
            id: newId,
            title: initialPrompt ? (initialPrompt.length > 30 ? initialPrompt.substring(0, 30) + "..." : initialPrompt) : "New Draft",
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const updatedSessions = [newSession, ...sessions];
        setSessions(updatedSessions);
        setActiveSessionId(newId);
        setMessages([]);
        localStorage.setItem(ACTIVE_SESSION_KEY, newId);
        
        router.push(`/drafting/new?sessionId=${newId}${initialPrompt ? `&prompt=${encodeURIComponent(initialPrompt)}` : ""}`);

        if (initialPrompt) {
            handleGenerate(initialPrompt, newId, updatedSessions);
        }
    };

    const handleSelectSession = (id: string) => {
        const session = sessions.find(s => s.id === id);
        if (session) {
            setActiveSessionId(id);
            setMessages(session.messages || []);
            localStorage.setItem(ACTIVE_SESSION_KEY, id);
            router.push(`/drafting/new?sessionId=${id}`);
        }
    };

    const handleDeleteSession = (id: string) => {
        const updatedSessions = sessions.filter(s => s.id !== id);
        setSessions(updatedSessions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
        if (activeSessionId === id) {
            if (updatedSessions.length > 0) {
                handleSelectSession(updatedSessions[0].id);
            } else {
                router.push("/drafting");
            }
        }
    };

    const handleRenameSession = (id: string, newTitle: string) => {
        const updated = sessions.map(s => s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s);
        setSessions(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const handleGenerate = async (queryInput?: string, targetSessionId?: string, currentSessions?: ChatSession[]) => {
        const query = queryInput || input;
        const sId = targetSessionId || activeSessionId;
        const sList = currentSessions || sessions;

        if (!query.trim() || !sId) return;

        const sessionIndex = sList.findIndex(s => s.id === sId);
        if (sessionIndex === -1) return;

        const currentSessionMessages = sList[sessionIndex].messages || [];
        const userMessage: ChatMessage = { role: "user", content: query };
        const newMessagesForHistory = [...currentSessionMessages, userMessage];
        
        // Update local state immediately for UI responsiveness
        if (sId === activeSessionId) {
            setMessages(newMessagesForHistory);
            setInput("");
        }
        
        setIsLoading(true);

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://yuktiai.onrender.com";
            const response = await fetch(`${apiBase}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    intent: "drafting",
                    history: currentSessionMessages.map(m => ({ role: m.role, content: m.content }))
                }),
            });

            const data = await response.json();
            
            // The backend returns: { route: "drafting_agent", result: { response_message, generated_template, ... } }
            const draftResult = data.result || data;
            const responseMessage = draftResult.response_message || data.response_text || "";
            const generatedTemplate = draftResult.generated_template || "";
            
            // Combine the response message and template for display
            const fullContent = generatedTemplate 
                ? `${responseMessage}\n\n${generatedTemplate}`
                : responseMessage || "No response received.";
            
            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: fullContent,
                metadata: {
                    generated_template: generatedTemplate,
                    detected_draft_type: draftResult.detected_draft_type,
                },
            };

            const finalMessages = [...newMessagesForHistory, assistantMessage];
            
            if (sId === activeSessionId) {
                setMessages(finalMessages);
            }

            // Update session in list and persist
            setSessions((prev) => {
                const updated = prev.map((s) => {
                    if (s.id === sId) {
                        return {
                            ...s,
                            messages: finalMessages,
                            updatedAt: Date.now(),
                            title: s.messages.length === 0 ? (query.length > 30 ? query.substring(0, 30) + "..." : query) : s.title
                        };
                    }
                    return s;
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });

        } catch (error) {
            console.error("Drafting error:", error);
            const errorMessage: ChatMessage = { role: "assistant", content: "Sorry, I encountered an error while drafting. Please try again." };
            if (sId === activeSessionId) {
                setMessages(prev => [...prev, errorMessage]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-white pt-16 overflow-hidden">
            <ChatHistorySidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onNewChat={() => createNewSession()}
                onSelectSession={handleSelectSession}
                onRenameSession={handleRenameSession}
                onDeleteSession={handleDeleteSession}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/drafting"
                            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-semibold text-zinc-900">
                                {sessions.find(s => s.id === activeSessionId)?.title || "New Draft"}
                            </h1>
                            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
                                Drafting Agent
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                            <Share2 className="w-4 h-4" /> Share
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-sm">
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>

                {/* Messages Container */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center animate-in fade-in duration-700">
                            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
                                <PenTool className="w-8 h-8 text-zinc-400" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-3">What are we drafting today?</h2>
                            <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
                                Tell me the context, jurisdiction, and type of document. I'll help you create a professional legal draft.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 mt-10 w-full max-w-xl">
                                {[
                                    "Legal Notice for Section 138",
                                    "Non-Disclosure Agreement",
                                    "Residential Rent Agreement",
                                    "Bail Application under CrPC"
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleGenerate(suggestion)}
                                        className="p-3 text-left text-sm border border-zinc-100 rounded-xl hover:border-zinc-300 hover:bg-zinc-50 transition-all text-zinc-600 font-medium"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8">
                            {messages.map((message, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl p-6 ${message.role === "user"
                                                ? "bg-zinc-900 text-white shadow-md"
                                                : "bg-[#FAFAFA] border border-zinc-200 text-zinc-900 shadow-sm"
                                            }`}
                                    >
                                        {message.role === "assistant" && (
                                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-100">
                                                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">YuktiAI Drafting Agent</div>
                                                <CopyButton text={message.content} />
                                            </div>
                                        )}
                                        <div className={`prose prose-sm max-w-none ${message.role === "user" ? "dark:prose-invert" : "prose-headings:text-zinc-900 prose-p:text-zinc-800 prose-strong:text-zinc-900"} prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed`}>
                                            <ReactMarkdown>{message.content || "Empty response."}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm">
                                        <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                                    </div>
                                </div>
                            )
                            }
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white shrink-0">
                    <div className="max-w-4xl mx-auto relative group">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                            placeholder="Type instructions to refine your draft..."
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-5 pr-14 py-4 text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white transition-all resize-none shadow-sm placeholder:text-zinc-400"
                            rows={1}
                        />
                        <button
                            onClick={() => handleGenerate()}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 text-center mt-3 font-medium uppercase tracking-[0.1em]">
                        AI Drafting agent can make mistakes. Please verify all legal content.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function NewDraftPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white"><Loader2 className="w-8 h-8 text-zinc-300 animate-spin" /></div>}>
            <DraftingContent />
        </Suspense>
    );
}
