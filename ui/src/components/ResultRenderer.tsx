import { Card } from "./ui/card";
import { AlertTriangle, CheckCircle, Clock, BookOpen, PenTool } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function ResultRenderer({ content, metadata }: { content: string, metadata: any }) {

    if (!metadata || !metadata.type) {
        return <p className="whitespace-pre-wrap">{content}</p>;
    }

    const { type, results } = metadata;

    if (type === "legal_search" && Array.isArray(results)) {
        return (
            <div className="flex flex-col gap-4">
                <p className="text-sm font-medium text-zinc-500 mb-2">Here are the Supreme Court/High Court records found:</p>
                <div className="grid gap-3">
                    {results.map((r: any, idx: number) => (
                        <Card key={idx} className="p-4 hover:bg-zinc-50 transition-colors border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold mb-1 text-base hover:underline block">{r.title}</a>
                            <p className="text-xs font-semibold text-zinc-500 mb-2">{r.citation || r.docsource || "Indian Kanoon"}</p>
                            <div className="text-sm text-zinc-700 line-clamp-3" dangerouslySetInnerHTML={{ __html: r.snippet }} />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (type === "web_search" && Array.isArray(results)) {
        return (
            <div className="flex flex-col gap-4">
                <p className="text-sm font-medium text-zinc-500 mb-2">Here are the web search results:</p>
                <div className="grid gap-3">
                    {results.map((r: any, idx: number) => (
                        <Card key={idx} className="p-4 hover:bg-zinc-50 transition-colors border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <a href={r.link} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold mb-1 text-base hover:underline block">{r.title}</a>
                            <p className="text-sm text-zinc-700">{r.snippet}</p>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (type === "general_chat" && results) {
        return (
            <div className="flex flex-col gap-4">
                <div className="prose prose-zinc dark:prose-invert max-w-none text-sm md:text-base leading-relaxed">
                    <ReactMarkdown>{results.answer}</ReactMarkdown>
                </div>

                {results.citations && results.citations.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
                            <BookOpen className="w-4 h-4" /> Legal Authorities Cited
                        </h4>
                        <ul className="space-y-2">
                            {results.citations.map((cite: any, i: number) => (
                                <li key={i} className="text-sm text-blue-900/80 dark:text-blue-200/80">
                                    <span className="font-semibold">{cite.reference}</span>: {cite.relevance}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {results.abstentions && results.abstentions.length > 0 && (
                    <div className="mt-2 text-sm text-zinc-500 flex items-start gap-2 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold">Note:</span> The system abstained from confirming the following due to lack of certainty:
                            <ul className="list-disc pl-4 mt-1">
                                {results.abstentions.map((item: string, i: number) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (type === "adversarial_engine" && results) {
        return (
            <div className="flex flex-col gap-4">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-2">Adversarial Analysis Complete. Score: <span className="font-bold">{results.confidence_score}/10</span></p>

                {results.flagged_issues?.length > 0 ? (
                    <div className="grid gap-3">
                        {results.flagged_issues.map((issue: any, idx: number) => (
                            <Card key={idx} className="p-4 border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/20 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    <h3 className="text-red-800 dark:text-red-300 font-semibold text-sm capitalize">{issue.type.replace(/_/g, " ")}</h3>
                                </div>
                                <blockquote className="border-l-2 border-red-300 dark:border-red-800 pl-3 py-1 my-2 text-sm italic text-zinc-600 dark:text-zinc-400">
                                    "{issue.line_snippet}"
                                </blockquote>
                                <p className="text-sm text-red-900/80 dark:text-red-200/80 mt-2">
                                    {issue.recommendation}
                                </p>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">No major procedural or logical weak points detected.</span>
                    </div>
                )}
            </div>
        );
    }

    if (type === "procedural_navigator" && results) {
        if (results.error) {
            return <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg">{results.error}</div>;
        }

        return (
            <div className="flex flex-col gap-4">
                <Card className="p-5 border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-3 flex-1">
                            <div>
                                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Current Stage</p>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{results.current_stage}</p>
                            </div>

                            <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full my-2"></div>

                            <div>
                                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Next Procedural Step</p>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{results.next_procedural_step}</p>
                            </div>

                            <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg mt-3 flex justify-between items-center text-sm">
                                <div>
                                    <span className="text-zinc-500">Timeline:</span>{" "}
                                    <span className="font-semibold">{results.timeline_days} days</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-zinc-500">Max Extension:</span>{" "}
                                    <span className="font-semibold">{results.max_extension_days} days</span>
                                </div>
                            </div>

                            <p className="text-xs text-zinc-500 italic mt-2">
                                Authority: {results.statutory_reference}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    if (type === "document_processor" && results) {
        return (
            <div className="flex flex-col gap-4">
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Summary</h3>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{results.summary}</p>
                </div>

                {results.timeline && results.timeline.length > 0 && (
                    <div className="mt-2">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 ml-1">Timeline of Events</h3>
                        <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-3 space-y-6 pb-4">
                            {results.timeline.map((event: any, idx: number) => (
                                <div key={idx} className="relative pl-6">
                                    <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-zinc-950" />
                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 block">{event.date}</span>
                                    <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium mb-1">{event.event}</p>
                                    <p className="text-xs text-zinc-500 italic">"{event.exact_quote}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (type === "drafting_agent" && results) {
        return (
            <div className="flex flex-col gap-4">
                <div className="prose prose-zinc dark:prose-invert max-w-none text-sm md:text-base leading-relaxed">
                    <ReactMarkdown>{results.response_message}</ReactMarkdown>
                </div>

                {results.is_draft_type_clear && results.generated_template && (
                    <div className="mt-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 rounded-t-xl border border-zinc-200 dark:border-zinc-800 border-b-0">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                                <PenTool className="w-3.5 h-3.5" />
                                {results.detected_draft_type || "Generated Template"}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-zinc-950 p-8 rounded-b-xl border border-zinc-200 dark:border-zinc-800">
                            <pre className="whitespace-pre-wrap font-serif text-[15px] text-zinc-900 dark:text-zinc-100 leading-relaxed max-w-none">
                                {results.generated_template}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Default fallback
    return <p className="whitespace-pre-wrap">{content}</p>;
}
