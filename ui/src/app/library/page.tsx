"use client";

import { useState, useRef, useEffect } from "react";
import {
    BookOpen,
    Search,
    Filter,
    ChevronDown,
    X,
    Calendar as CalendarIcon,
    Loader2,
    ExternalLink,
    AlertCircle
} from "lucide-react";

interface SearchResult {
    title: string;
    doc_id: string;
    snippet: string;
    docsource: string;
    url: string;
}

export default function LegalLibraryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter State
    const [activeTab, setActiveTab] = useState<"legislative" | "court">("legislative");

    // Legislative Acts Form State
    const [actType, setActType] = useState("");
    const [status, setStatus] = useState("");
    const [year, setYear] = useState("");
    const [language, setLanguage] = useState("");

    // Court Judgements Form State
    const [court, setCourt] = useState("");
    const [outcome, setOutcome] = useState("");
    const [judgeNameInput, setJudgeNameInput] = useState("");
    const [judges, setJudges] = useState<string[]>([]);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Click outside to close filter
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const executeSearch = async (queryToSearch?: string) => {
        const query = queryToSearch || searchQuery;
        if (!query.trim()) return;

        setIsFilterOpen(false);
        setIsLoading(true);
        setError(null);

        // Build a more complex query if filters are applied
        let finalQuery = query;
        if (activeTab === "legislative") {
            if (actType) finalQuery += ` ${actType}`;
            if (year) finalQuery += ` ${year}`;
            if (status) finalQuery += ` ${status}`;
        } else {
            if (court) finalQuery += ` ${court.replace("_", " ")}`;
            if (outcome) finalQuery += ` ${outcome}`;
            if (judges.length > 0) finalQuery += ` ${judges.join(" ")}`;
        }

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://yuktiai.onrender.com";
            const res = await fetch(`${apiBase}/api/library/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: finalQuery.trim(), pagenum: 0 })
            });

            if (!res.ok) {
                let errorDetail = `Search failed (${res.status})`;
                try {
                    const errBody = await res.json();
                    if (errBody.detail) {
                        if (errBody.detail.includes("INDIAN_KANOON_TOKEN")) {
                            errorDetail = "The Indian Kanoon API token is not configured on the server. Please ask the administrator to add the INDIAN_KANOON_TOKEN environment variable on the backend hosting platform (Render).";
                        } else {
                            errorDetail = errBody.detail;
                        }
                    }
                } catch { /* couldn't parse body */ }
                throw new Error(errorDetail);
            }

            const data = await res.json();
            if (data.status === "success" && data.results) {
                setSearchResults(data.results);
            } else {
                setSearchResults([]);
                setError("No results found for your query. Try different keywords.");
            }
        } catch (err: any) {
            console.error("Search error:", err);
            setError(err.message || "An error occurred while searching.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyFilters = () => {
        executeSearch();
    };

    const handleAddJudge = () => {
        if (judgeNameInput.trim() && !judges.includes(judgeNameInput.trim())) {
            setJudges([...judges, judgeNameInput.trim()]);
            setJudgeNameInput("");
        }
    };

    const handleRemoveJudge = (name: string) => {
        setJudges(judges.filter(j => j !== name));
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center pt-16 px-4">
            {/* Header */}
            <div className="w-full max-w-4xl flex flex-col">
                <div className="flex items-center gap-3 mb-8 ml-2">
                    <BookOpen className="w-6 h-6 text-zinc-900" />
                    <h1 className="text-2xl font-bold font-serif text-zinc-900 tracking-tight">Legal Library</h1>
                </div>

                {/* Search Bar Container */}
                <div className="relative flex items-center gap-3 w-full">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search for Acts, Judgements.."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    executeSearch();
                                }
                            }}
                            className="w-full pl-6 pr-12 py-3.5 bg-white border border-zinc-200 rounded-full text-[15px] outline-none focus:border-zinc-400 transition-colors shadow-sm text-zinc-800 placeholder:text-zinc-400"
                        />
                        <button 
                            onClick={() => executeSearch()}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-100 rounded-full transition-colors"
                        >
                            <Search className="w-5 h-5 text-zinc-500" />
                        </button>
                    </div>

                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`w-12 h-12 flex items-center justify-center rounded-full border transition-all ${isFilterOpen
                                ? "bg-zinc-100 border-zinc-300 text-zinc-800"
                                : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 hover:bg-zinc-50 shadow-sm"
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                        </button>

                        {/* Filter Popover */}
                        {isFilterOpen && (
                            <div className="absolute top-16 right-0 w-[420px] bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                                {/* Tabs */}
                                <div className="flex bg-zinc-50 p-1 border-b border-zinc-100">
                                    <button
                                        onClick={() => setActiveTab("legislative")}
                                        className={`flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-all ${activeTab === "legislative"
                                            ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/60"
                                            : "text-zinc-500 hover:text-zinc-700"
                                            }`}
                                    >
                                        Legislative Acts
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("court")}
                                        className={`flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-all ${activeTab === "court"
                                            ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/60"
                                            : "text-zinc-500 hover:text-zinc-700"
                                            }`}
                                    >
                                        Court Judgements
                                    </button>
                                </div>

                                {/* Form Body */}
                                <div className="p-6 space-y-5">
                                    {activeTab === "legislative" ? (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-semibold text-zinc-800">Act Type</label>
                                                <div className="relative">
                                                    <select
                                                        value={actType} onChange={e => setActType(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 appearance-none outline-none focus:border-zinc-400"
                                                    >
                                                        <option value="" disabled>Select Document Type</option>
                                                        <option value="central">Central Act</option>
                                                        <option value="state">State Act</option>
                                                        <option value="ordinance">Ordinance</option>
                                                    </select>
                                                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-semibold text-zinc-800">Status</label>
                                                <div className="relative">
                                                    <select
                                                        value={status} onChange={e => setStatus(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 appearance-none outline-none focus:border-zinc-400"
                                                    >
                                                        <option value="" disabled>Select Status</option>
                                                        <option value="in_force">In Force</option>
                                                        <option value="repealed">Repealed</option>
                                                    </select>
                                                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-semibold text-zinc-800">Year of Enactment</label>
                                                <div className="relative">
                                                    <select
                                                        value={year} onChange={e => setYear(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 appearance-none outline-none focus:border-zinc-400"
                                                    >
                                                        <option value="" disabled>Select Year</option>
                                                        {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                                            <option key={y} value={y}>{y}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-semibold text-zinc-800">Language</label>
                                                <div className="relative">
                                                    <select
                                                        value={language} onChange={e => setLanguage(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 appearance-none outline-none focus:border-zinc-400"
                                                    >
                                                        <option value="" disabled>Select Language</option>
                                                        <option value="english">English</option>
                                                        <option value="hindi">Hindi</option>
                                                    </select>
                                                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-semibold text-zinc-800">Court / Tribunal</label>
                                                <div className="relative">
                                                    <select
                                                        value={court} onChange={e => setCourt(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 appearance-none outline-none focus:border-zinc-400"
                                                    >
                                                        <option value="" disabled>Select courts...</option>
                                                        <option value="supreme_court">Supreme Court of India</option>
                                                        <option value="delhi_hc">Delhi High Court</option>
                                                        <option value="bombay_hc">Bombay High Court</option>
                                                        <option value="calcutta_hc">Calcutta High Court</option>
                                                        <option value="madras_hc">Madras High Court</option>
                                                        <option value="karnataka_hc">Karnataka High Court</option>
                                                        <option value="kerala_hc">Kerala High Court</option>
                                                        <option value="gujarat_hc">Gujarat High Court</option>
                                                        <option value="rajasthan_hc">Rajasthan High Court</option>
                                                        <option value="madhya_pradesh_hc">Madhya Pradesh High Court</option>
                                                        <option value="allahabad_hc">Allahabad High Court</option>
                                                        <option value="andhra_pradesh_hc">Andhra Pradesh High Court</option>
                                                        <option value="telangana_hc">Telangana High Court</option>
                                                        <option value="patna_hc">Patna High Court</option>
                                                        <option value="orissa_hc">Orissa High Court</option>
                                                        <option value="chhattisgarh_hc">Chhattisgarh High Court</option>
                                                        <option value="jharkhand_hc">Jharkhand High Court</option>
                                                        <option value="uttarakhand_hc">Uttarakhand High Court</option>
                                                        <option value="himachal_pradesh_hc">Himachal Pradesh High Court</option>
                                                        <option value="punjab_and_haryana_hc">Punjab and Haryana High Court</option>
                                                        <option value="jammu_and_kashmir_hc">Jammu and Kashmir High Court</option>
                                                    </select>
                                                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-semibold text-zinc-800">Case Outcome</label>
                                                <div className="relative">
                                                    <select
                                                        value={outcome} onChange={e => setOutcome(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 appearance-none outline-none focus:border-zinc-400"
                                                    >
                                                        <option value="" disabled>Select outcome...</option>
                                                        <option value="allowed">Allowed</option>
                                                        <option value="dismissed">Dismissed</option>
                                                        <option value="disposed">Disposed</option>
                                                    </select>
                                                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-semibold text-zinc-800">Judge Name</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Search judges..."
                                                        value={judgeNameInput}
                                                        onChange={e => setJudgeNameInput(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleAddJudge()}
                                                        className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] outline-none focus:border-zinc-400 placeholder:text-zinc-400 text-zinc-800"
                                                    />
                                                    <button
                                                        onClick={handleAddJudge}
                                                        className="px-5 py-2.5 bg-white border border-zinc-800 rounded-lg text-[13px] font-medium text-zinc-800 hover:bg-zinc-50 transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                                {judges.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        {judges.map(j => (
                                                            <div key={j} className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1.5 rounded text-[12px] text-zinc-700">
                                                                {j}
                                                                <button onClick={() => handleRemoveJudge(j)} className="text-zinc-400 hover:text-zinc-600">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-semibold text-zinc-800">Decision Date</label>
                                                <div className="flex gap-3">
                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-[10px] text-zinc-500">From</label>
                                                        <div className="relative">
                                                            <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                            <input
                                                                type="date"
                                                                value={dateFrom}
                                                                onChange={e => setDateFrom(e.target.value)}
                                                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 outline-none focus:border-zinc-400"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-[10px] text-zinc-500">To</label>
                                                        <div className="relative">
                                                            <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                            <input
                                                                type="date"
                                                                value={dateTo}
                                                                onChange={e => setDateTo(e.target.value)}
                                                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-600 outline-none focus:border-zinc-400"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                </div>

                                {/* Footer */}
                                <div className="flex justify-between gap-3 p-6 pt-2">
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="flex-1 py-3 text-[13px] font-semibold text-zinc-800 border border-zinc-800 rounded-xl hover:bg-zinc-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApplyFilters}
                                        className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-800 text-white text-[13px] font-semibold rounded-xl shadow-sm transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
                
                {/* Example Searches */}
                <div className="flex flex-wrap items-center gap-2 mt-4 ml-2">
                    <span className="text-[12px] text-zinc-400 font-medium mr-1">Quick Search:</span>
                    {[
                        "IPC", 
                        "CrPC", 
                        "Family Law", 
                        "Property Act", 
                        "Supreme Court", 
                        "Habeas Corpus"
                    ].map((example) => (
                        <button
                            key={example}
                            onClick={() => {
                                setSearchQuery(example);
                                executeSearch(example);
                            }}
                            className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-full text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300 transition-all shadow-sm"
                        >
                            {example}
                        </button>
                    ))}
                </div>

                {/* Results Area */}
                <div className="w-full mt-8 pb-20">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p className="text-sm font-medium">Searching legal library...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                            <AlertCircle className="w-8 h-8 mb-4 text-red-400" />
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold text-zinc-900 mb-6">Search Results ({searchResults.length})</h2>
                            {searchResults.map((result, idx) => (
                                <a 
                                    key={idx} 
                                    href={result.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block p-6 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 hover:shadow-sm transition-all group"
                                >
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                        <h3 
                                            className="text-base font-semibold text-zinc-900 leading-snug group-hover:text-blue-600 transition-colors"
                                            dangerouslySetInnerHTML={{ __html: result.title || "Untitled Document" }}
                                        />
                                        <ExternalLink className="w-4 h-4 text-zinc-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <p className="text-sm text-zinc-600 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: result.snippet || "No description available." }}></p>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-[11px] font-medium tracking-wide uppercase rounded-md">
                                            {result.docsource || "Legal Document"}
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100">
                                <Search className="w-6 h-6 text-zinc-300" />
                            </div>
                            <h3 className="text-sm font-semibold text-zinc-900 mb-1">No results</h3>
                            <p className="text-sm text-zinc-500 max-w-sm">Enter a search term or apply filters to find legislative acts and court judgements.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
