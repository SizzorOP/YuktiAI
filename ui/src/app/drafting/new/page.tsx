"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Scale, Mic, Send, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    metadata?: {
        type?: string;
        results?: any;
    };
};

export default function NewDraftPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [promptText, setPromptText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages get added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleAbort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
        }
    }, []);

    const handleGenerate = async () => {
        if (!promptText.trim() || isLoading) return;

        // Abort previous search if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const query = promptText;
        setPromptText("");
        
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: query,
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            
            // Build history payload from earlier messages
            const sessionHistory = messages.map(m => {
                let text = m.content;
                if (m.metadata?.results?.generated_template) {
                    text += `\n\n[PREVIOUS DRAFT GENERATED]:\n${m.metadata.results.generated_template}`;
                }
                return { role: m.role, content: text };
            });
            
            const payload = {
                query,
                history: sessionHistory
            };

            const res = await fetch(`${API_URL}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: abortControllerRef.current.signal,
            });

            if (!res.ok) throw new Error("API Request Failed");

            const data = await res.json();
            
            // Expected from drafting_agent:
            // data.result { is_draft_type_clear: bool, detected_draft_type: str, response_message: str, generated_template: str|null }
            
            let aiContent = "";
            let generatedDraft = null;
            
            if (data.result && typeof data.result === 'object') {
                aiContent = data.result.response_message || "Here is your response.";
                if (data.result.is_draft_type_clear && data.result.generated_template) {
                     generatedDraft = data.result.generated_template;
                }
            } else {
                 aiContent = "Received an unexpected format from the drafting agent.";
            }

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiContent,
                metadata: {
                    type: "drafting_agent",
                    results: generatedDraft ? { generated_template: generatedDraft, detected_draft_type: data.result.detected_draft_type } : null,
                },
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (err: any) {
             if (err.name === 'AbortError') return;

             const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again or check the backend connection.",
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const hasStarted = messages.length > 0;

    return (
        <div className="flex h-[calc(100vh-64px)] md:h-screen overflow-hidden font-sans text-zinc-900 bg-white dark:bg-zinc-950">
            
            {/* Top Back Link */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 hidden md:block">
                <Link href="/drafting" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Drafting
                </Link>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <div className={`flex flex-col transition-all duration-700 ease-in-out w-full ${hasStarted ? "pt-6 flex-1 min-h-0" : "justify-center items-center h-full px-4"}`}>
                    
                    {/* Empty State */}
                    {!hasStarted && (
                        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 max-w-3xl mx-auto w-full">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-200">
                                <Scale className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-center">
                                Legal Drafting Agent
                            </h1>
                            <p className="text-lg text-zinc-500 mb-8 max-w-lg text-center">
                                Describe the legal document, notice, or petition you need drafted. You can refine it iteratively.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center max-w-2xl px-4 mt-6">
                                <button onClick={() => setPromptText("Draft a legal notice for section 138 cheque bounce.")} className="px-4 py-2 border border-zinc-200 text-sm rounded-full text-zinc-600 hover:bg-zinc-50 transition-colors bg-white shadow-sm">
                                    Section 138 Notice
                                </button>
                                <button onClick={() => setPromptText("Create a Non-Disclosure Agreement (NDA) for two tech companies.")} className="px-4 py-2 border border-zinc-200 text-sm rounded-full text-zinc-600 hover:bg-zinc-50 transition-colors bg-white shadow-sm">
                                    Tech NDA
                                </button>
                                <button onClick={() => setPromptText("Draft a bail application under section 438 CrPC.")} className="px-4 py-2 border border-zinc-200 text-sm rounded-full text-zinc-600 hover:bg-zinc-50 transition-colors bg-white shadow-sm">
                                    Anticipatory Bail Application
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`w-full transition-all duration-500 overflow-hidden ${hasStarted ? "flex-1 flex flex-col min-h-0" : "max-w-3xl translate-y-0 mx-auto"}`}>
                        {hasStarted && (
                            <div className="flex-1 overflow-y-auto w-full px-4 md:px-0">
                                {/* Message List Render */}
                                <div className="max-w-4xl mx-auto divide-y divide-transparent pb-4 space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            {/* User Message */}
                                            {msg.role === 'user' && (
                                                <div className="flex justify-end mb-6">
                                                    <div className="max-w-[85%] bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-4 sm:p-5 text-[15px] text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700/50 leading-relaxed font-medium">
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* AI Message */}
                                            {msg.role === 'assistant' && (
                                                <div className="flex items-start gap-4 mb-8">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200 shadow-sm mt-1">
                                                        <Scale className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-zinc-400 mb-2 ml-1">Drafting Agent</p>
                                                        
                                                        <div className="prose prose-zinc prose-sm md:prose-base max-w-none text-zinc-700 dark:text-zinc-300">
                                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                        </div>

                                                        {/* Render Draft Document if present */}
                                                        {msg.metadata?.results?.generated_template && (
                                                            <div className="mt-6 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                                                                <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-200 print:hidden text-white">
                                                                    <span className="text-sm font-semibold tracking-wide uppercase">
                                                                        Draft: {msg.metadata.results.detected_draft_type || 'Document'}
                                                                    </span>
                                                                    <button 
                                                                        onClick={() => navigator.clipboard.writeText(msg.metadata?.results?.generated_template)}
                                                                        className="flex items-center gap-2 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                                                                    >
                                                                        Copy Document
                                                                    </button>
                                                                </div>
                                                                <div className="p-6 md:p-10 text-sm font-serif leading-loose prose max-w-none prose-zinc">
                                                                    <ReactMarkdown>
                                                                        {msg.metadata.results.generated_template}
                                                                    </ReactMarkdown>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {isLoading && (
                                    <div className="max-w-4xl mx-auto px-4 md:px-0 pb-4 mt-4">
                                        <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200 shadow-sm mt-1">
                                                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-zinc-400 mb-3 ml-1">Agent is drafting...</p>
                                                <div className="flex flex-col gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                    <div className="h-4 w-full bg-zinc-200 rounded-lg animate-pulse" />
                                                    <div className="h-4 w-5/6 bg-zinc-200 rounded-lg animate-pulse" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className={`w-full transition-all duration-500 ${hasStarted ? "bg-gradient-to-t from-white via-white dark:from-zinc-950 dark:via-zinc-950 to-transparent pb-6 pt-4 px-4 z-40" : "px-4 pb-6"}`}>
                        <div className={hasStarted ? "max-w-4xl mx-auto w-full" : "w-full"}>
                            <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600 transition-all focus-within:shadow-md focus-within:border-zinc-300 dark:focus-within:border-zinc-600 p-3 sm:p-4">
                                <div className="flex flex-col">
                                    <textarea
                                        value={promptText}
                                        onChange={(e) => setPromptText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleGenerate();
                                            }
                                        }}
                                        placeholder="Ask for a legal draft or suggest a revision..."
                                        disabled={isLoading}
                                        className="w-full min-h-[50px] max-h-[200px] resize-none outline-none text-[15px] sm:text-[16px] text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 bg-transparent disabled:opacity-50 break-words mb-2 leading-relaxed"
                                        rows={1}
                                    />
                                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-1">
                                             {/* Additional controls could go here */}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isLoading ? (
                                                <button onClick={handleAbort} className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                                    Stop Generating
                                                </button>
                                            ) : (
                                                <button className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                                    <Mic className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={handleGenerate}
                                                disabled={isLoading || !promptText.trim()}
                                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors shadow-sm
                                                    ${isLoading || !promptText.trim() ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                                            >
                                                <Send className="w-4 h-4 -ml-0.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
