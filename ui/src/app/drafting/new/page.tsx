"use client";

import { useState } from "react";
import { Plus, Mic, Send, Loader2, ArrowLeft, Copy, Check } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export default function NewDraftPage() {
    const [promptText, setPromptText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [draftResult, setDraftResult] = useState<{
        is_draft_type_clear: boolean;
        detected_draft_type: string | null;
        response_message: string;
        generated_template: string | null;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!promptText.trim() || isGenerating) return;
        setIsGenerating(true);
        setDraftResult(null);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${API_URL}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: promptText }),
            });

            if (!res.ok) throw new Error("Failed to generate draft");
            const data = await res.json();

            if (data.result && typeof data.result === 'object') {
                setDraftResult(data.result);
            } else {
                setDraftResult({
                    is_draft_type_clear: false,
                    detected_draft_type: null,
                    response_message: "Received an unexpected format from the drafting agent.",
                    generated_template: null
                });
            }
        } catch (err: any) {
            console.error(err);
            setDraftResult({
                is_draft_type_clear: false,
                detected_draft_type: null,
                response_message: "An error occurred while generating the draft. Please try again.",
                generated_template: null
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (draftResult?.generated_template) {
            navigator.clipboard.writeText(draftResult.generated_template);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const stepNum = draftResult ? (draftResult.is_draft_type_clear ? 3 : 1) : (isGenerating ? 2 : 1);

    return (
        <div className="min-h-screen bg-white flex flex-col relative w-full items-center">

            <div className="absolute top-6 left-6 z-20">
                <Link href="/drafting" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Drafting
                </Link>
            </div>

            {/* Top Stepper Navigation */}
            <div className="w-full border-b border-zinc-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 flex justify-center py-6 shrink-0 mt-8 md:mt-0">
                <div className="flex items-center gap-4 md:gap-6 max-w-3xl w-full px-6 flex-wrap justify-center">
                    {/* Step 1 */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <span className={`text-[13px] md:text-[14px] ${stepNum >= 1 ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-400'}`}>1. Prompt Input</span>
                        <div className={`hidden md:block w-8 h-[1px] ${stepNum >= 2 ? 'bg-zinc-400' : 'bg-zinc-200'}`}></div>
                    </div>
                    {/* Step 2 */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <span className={`text-[13px] md:text-[14px] ${stepNum >= 2 ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-400'}`}>2. Generation</span>
                        <div className={`hidden md:block w-8 h-[1px] ${stepNum >= 3 ? 'bg-zinc-400' : 'bg-zinc-200'}`}></div>
                    </div>
                    {/* Step 3 */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <span className={`text-[13px] md:text-[14px] ${stepNum >= 3 ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-400'}`}>3. Review Template</span>
                    </div>
                </div>
            </div>

            {/* Main Content Workspace */}
            <div className="flex-1 w-full flex flex-col items-center max-w-4xl px-4 py-8 relative">

                {isGenerating && (
                    <div className="flex-1 flex flex-col items-center justify-center mt-20">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                        <h2 className="text-xl font-semibold text-zinc-900 mb-2">Drafting your Document...</h2>
                        <p className="text-zinc-500">Applying legal formats and jurisdiction specific clauses.</p>
                    </div>
                )}

                {draftResult && !isGenerating && (
                    <div className="w-full mt-4 pb-32 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 mb-6">
                            <h3 className="font-semibold text-zinc-900">Agent Response</h3>
                            <p className="text-zinc-700 mt-2 text-sm leading-relaxed">{draftResult.response_message}</p>
                        </div>

                        {draftResult.is_draft_type_clear && draftResult.generated_template && (
                            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-200 lg:sticky lg:top-[85px] z-10">
                                    <span className="text-sm font-semibold text-white tracking-wide uppercase">Generated Template: {draftResult.detected_draft_type}</span>
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? "Copied!" : "Copy Full Text"}
                                    </button>
                                </div>
                                <div className="p-6 md:p-10 prose prose-zinc max-w-none text-sm font-serif leading-loose">
                                    <ReactMarkdown>{draftResult.generated_template}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Input Workspace */}
                <div className={`w-full transition-all duration-500 ease-in-out ${draftResult ? 'fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-zinc-200 p-4 z-30' : 'absolute bottom-16 left-4 right-4 max-w-3xl mx-auto'}`}>
                    <div className={`w-full bg-white border border-zinc-200 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 transition-all focus-within:shadow-md focus-within:border-zinc-300 p-4 ${draftResult ? 'max-w-4xl mx-auto' : ''}`}>
                        <textarea
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                            placeholder="Describe the legal draft or notice you need..."
                            className="w-full min-h-[50px] max-h-[200px] resize-none outline-none text-[15px] text-zinc-800 placeholder:text-zinc-500 bg-transparent mb-4"
                            rows={2}
                            disabled={isGenerating}
                        />
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
                            {/* Left Action Button */}
                            <button className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>

                            {/* Right Action Buttons */}
                            <div className="flex items-center gap-2">
                                <button className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
                                    <Mic className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !promptText.trim()}
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 text-white transition-colors shadow-sm"
                                >
                                    <Send className="w-4 h-4 -ml-0.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
