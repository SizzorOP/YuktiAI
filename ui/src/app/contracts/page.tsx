"use client";

import { useState } from "react";
import { FileSignature, Upload, Loader2, Play } from "lucide-react";
import { ClauseCard } from "@/components/ClauseCard";

interface Clause {
    clause_title: string;
    original_text: string;
    risk_score: number;
    risk_reasoning: string;
}

export default function ContractsPage() {
    const [contractText, setContractText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [clauses, setClauses] = useState<Clause[]>([]);

    // For handling per-clause actions
    const [rewritingIndex, setRewritingIndex] = useState<number | null>(null);
    const [findingPrecedentsIndex, setFindingPrecedentsIndex] = useState<number | null>(null);
    const [rewrittenTexts, setRewrittenTexts] = useState<Record<number, { text: string; stance: string }>>({});

    const handleAnalyze = async () => {
        if (!contractText.trim()) return;

        setIsAnalyzing(true);
        setClauses([]);
        setRewrittenTexts({});

        try {
            const res = await fetch("/api/contracts/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ document_text: contractText })
            });

            if (!res.ok) throw new Error("Failed to analyze contract");
            const data = await res.json();
            setClauses(data.clauses || []);
        } catch (error) {
            console.error("Analysis Error:", error);
            alert("An error occurred while analyzing the contract.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".pdf")) {
            alert("Please upload a PDF file.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/contracts/upload", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to scan PDF");
            }

            const data = await res.json();
            setContractText(data.text);
        } catch (error: any) {
            console.error("Upload Error:", error);
            alert(error.message || "An error occurred while uploading the PDF.");
        } finally {
            setIsUploading(false);
            // Reset the file input so the same file could be uploaded again if needed
            e.target.value = "";
        }
    };

    const handleRewrite = async (index: number, clauseText: string, stance: string) => {
        setRewritingIndex(index);
        try {
            const res = await fetch("/api/contracts/rewrite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clause_text: clauseText, stance })
            });

            if (!res.ok) throw new Error("Failed to rewrite clause");
            const data = await res.json();

            setRewrittenTexts(prev => ({
                ...prev,
                [index]: { text: data.alternative_text, stance: data.stance_used }
            }));
        } catch (error) {
            console.error("Rewrite Error:", error);
            alert("Failed to rewrite the clause.");
        } finally {
            setRewritingIndex(null);
        }
    };

    const handleFindPrecedents = async (index: number, clauseText: string) => {
        setFindingPrecedentsIndex(index);
        try {
            const res = await fetch("/api/contracts/precedents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clause_text: clauseText })
            });

            if (!res.ok) throw new Error("Failed to find precedents");
            const data = await res.json();

            // For now, since we don't have a modals setup, we will just alert or log it.
            // Ideally this would open a side drawer or redirect to Research with the prompt.
            // Let's create a query string and open in a new tab to Research page
            const prompt = `Find precedents for this contract clause: ${clauseText}`;
            window.open(`/research?prompt=${encodeURIComponent(prompt)}`, "_blank");

        } catch (error) {
            console.error("Precedents Error:", error);
            alert("Failed to find precedents.");
        } finally {
            setFindingPrecedentsIndex(null);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] md:h-screen flex flex-col bg-zinc-50/50">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-5 border-b border-zinc-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                        <FileSignature className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold font-serif text-zinc-900 tracking-tight leading-tight">Contract Analysis</h1>
                        <p className="text-[13px] text-zinc-500 font-medium">Extract clauses, assess absolute risks, and generate alternatives.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-[13px] font-semibold cursor-pointer shadow-sm transition-colors">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload PDF
                        <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading || isAnalyzing}
                        />
                    </label>
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !contractText.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-[13px] font-semibold shadow-sm transition-colors"
                    >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Analyze Contract
                    </button>
                </div>
            </div>

            {/* Split View */}
            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">

                {/* Left Side: Document Input / View */}
                <div className="flex-1 lg:w-1/2 border-r border-zinc-200 bg-white flex flex-col min-h-0">
                    <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                        <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Original Contract</span>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto">
                        <textarea
                            className="w-full h-full min-h-[400px] p-4 text-[14px] text-zinc-800 leading-relaxed border border-zinc-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none font-serif bg-zinc-50/30"
                            placeholder="Paste your legal contract, NDA, or bespoke agreement here to extract and score its clauses..."
                            value={contractText}
                            onChange={(e) => setContractText(e.target.value)}
                        />
                    </div>
                </div>

                {/* Right Side: Analysis Results */}
                <div className="flex-1 lg:w-1/2 bg-zinc-50/30 flex flex-col min-h-0 relative">
                    <div className="px-5 py-3 border-b border-zinc-100 bg-white flex items-center justify-between shadow-sm z-10">
                        <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Clause Intelligence Intelligence</span>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-red-500"></span> High Risk</span>
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Medium</span>
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-green-500"></span> Low</span>
                        </div>
                    </div>

                    <div className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200">
                        {clauses.length === 0 && !isAnalyzing ? (
                            <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                <div className="w-16 h-16 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                    <Upload className="w-8 h-8 text-zinc-300" />
                                </div>
                                <h3 className="text-[16px] font-semibold text-zinc-900 mb-2">No Analysis Yet</h3>
                                <p className="text-[14px] text-zinc-500 max-w-sm">
                                    Paste a contract on the left or upload a PDF to automatically extract and score its material clauses.
                                </p>
                            </div>
                        ) : isAnalyzing ? (
                            <div className="h-full flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                                <h3 className="text-[15px] font-semibold text-zinc-800 mb-1">Analyzing Contract...</h3>
                                <p className="text-[13px] text-zinc-500 text-center max-w-xs">Reading document, extracting clauses, and assessing absolute legal risk...</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-w-2xl mx-auto pb-10">
                                {clauses.map((clause, idx) => (
                                    <ClauseCard
                                        key={idx}
                                        title={clause.clause_title}
                                        originalText={clause.original_text}
                                        riskScore={clause.risk_score}
                                        riskReasoning={clause.risk_reasoning}

                                        isRewriting={rewritingIndex === idx}
                                        isFindingPrecedents={findingPrecedentsIndex === idx}
                                        rewrittenText={rewrittenTexts[idx]?.text}
                                        rewriteStance={rewrittenTexts[idx]?.stance}

                                        onRewrite={(stance) => handleRewrite(idx, clause.original_text, stance)}
                                        onFindPrecedents={() => handleFindPrecedents(idx, clause.original_text)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
