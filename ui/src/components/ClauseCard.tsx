import { useState } from "react";
import { Copy, RefreshCw, AlertTriangle, ShieldCheck, Scale, Search, Loader2, Sparkles } from "lucide-react";

interface ClauseCardProps {
    title: string;
    originalText: string;
    riskScore: number;
    riskReasoning: string;
    onRewrite: (stance: string) => void;
    onFindPrecedents: () => void;
    isRewriting?: boolean;
    isFindingPrecedents?: boolean;
    rewrittenText?: string;
    rewriteStance?: string;
}

export function ClauseCard({
    title, originalText, riskScore, riskReasoning,
    onRewrite, onFindPrecedents,
    isRewriting, isFindingPrecedents,
    rewrittenText, rewriteStance
}: ClauseCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Risk Level Definition
    let riskLevel = "Low";
    let riskColor = "text-green-600 bg-green-50 border-green-200";
    let riskIcon = <ShieldCheck className="w-4 h-4 text-green-600" />;

    if (riskScore >= 8) {
        riskLevel = "High";
        riskColor = "text-red-600 bg-red-50 border-red-200";
        riskIcon = <AlertTriangle className="w-4 h-4 text-red-600" />;
    } else if (riskScore >= 4) {
        riskLevel = "Medium";
        riskColor = "text-yellow-600 bg-yellow-50 border-yellow-200";
        riskIcon = <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden mb-4 transition-all">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${riskColor} border`}>
                        <span className="font-bold text-sm">{riskScore}</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-zinc-900 text-[15px]">{title}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[12px] font-medium text-zinc-500">
                            {riskIcon}
                            <span>{riskLevel} Risk</span>
                        </div>
                    </div>
                </div>
                <div className="text-zinc-400">
                    {isExpanded ? (
                        <span className="text-xl leading-none">&minus;</span>
                    ) : (
                        <span className="text-xl leading-none">+</span>
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-zinc-100 p-4 space-y-4">
                    {/* Reasoning */}
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100 text-[13px] text-zinc-700 leading-relaxed">
                        <strong className="text-zinc-900 font-semibold block mb-1">Analysis:</strong>
                        {riskReasoning}
                    </div>

                    {/* Original Text */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Original Text</span>
                            <button onClick={() => handleCopy(originalText)} className="text-zinc-400 hover:text-zinc-600 transition-colors" title="Copy Text">
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="text-[13px] text-zinc-800 leading-relaxed max-h-40 overflow-y-auto scrollbar-thin">
                            {originalText}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
                        <button
                            onClick={(e) => { e.stopPropagation(); onFindPrecedents(); }}
                            disabled={isFindingPrecedents}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-[12px] font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isFindingPrecedents ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                            Find Precedents
                        </button>

                        <div className="h-4 w-px bg-zinc-200 mx-1"></div>
                        <span className="text-[12px] font-medium text-zinc-500 mr-1">Rewrite:</span>

                        <button
                            onClick={(e) => { e.stopPropagation(); onRewrite("Aggressive/Pro-Client"); }}
                            disabled={isRewriting}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isRewriting && rewriteStance === "Aggressive/Pro-Client" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            Pro-Client
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); onRewrite("Neutral/Balanced"); }}
                            disabled={isRewriting}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[12px] font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isRewriting && rewriteStance === "Neutral/Balanced" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
                            Neutral
                        </button>
                    </div>

                    {/* Rewritten Text Result */}
                    {rewrittenText && (
                        <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[12px] font-bold text-blue-800 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" /> Suggested Revision ({rewriteStance})
                                </span>
                                <button onClick={() => handleCopy(rewrittenText)} className="text-blue-400 hover:text-blue-600 transition-colors" title="Copy Text">
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-[13px] text-zinc-800 leading-relaxed font-medium">
                                {rewrittenText}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
