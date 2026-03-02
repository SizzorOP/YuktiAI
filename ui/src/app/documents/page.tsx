"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, File, FileText, Image, Film, Music, Brain, Layers, Search, ArrowDownAZ, Upload, X, CalendarDays, HardDrive, Trash } from "lucide-react";
import { documentsApi, casesApi, DocumentItem, CaseItem } from "@/lib/api";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentViewer } from "@/components/DocumentViewer";

const FILE_CATEGORIES: Record<string, string[]> = {
    "PDFs": ["pdf"],
    "Photos": ["png", "jpg", "jpeg", "webp", "gif"],
    "Videos": ["mp4", "mov", "avi", "mkv"],
    "Audio": ["mp3", "wav", "m4a", "aac"],
    "Quiz": ["json", "txt"],
    "Flashcards": ["csv", "doc", "docx"],
};

const CATEGORY_TABS = ["All", "PDFs", "Photos", "Videos", "Audio", "Quiz", "Flashcards"];

function getIconForCategory(cat: string) {
    switch (cat) {
        case "PDFs": return <FileText className="w-4 h-4" />;
        case "Photos": return <Image className="w-4 h-4" />;
        case "Videos": return <Film className="w-4 h-4" />;
        case "Audio": return <Music className="w-4 h-4" />;
        case "Quiz": return <Brain className="w-4 h-4" />;
        case "Flashcards": return <Layers className="w-4 h-4" />;
        default: return <File className="w-4 h-4" />;
    }
}

export default function DocumentStoragePage() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal state
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedUploadCaseId, setSelectedUploadCaseId] = useState("");
    const [viewDocument, setViewDocument] = useState<DocumentItem | null>(null);

    type SortOption = "date_desc" | "date_asc" | "name_asc" | "name_desc" | "size_desc" | "size_asc";
    const [sortBy, setSortBy] = useState<SortOption>("date_desc");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [docsData, casesData] = await Promise.all([
                documentsApi.listAll(),
                casesApi.list()
            ]);
            setDocuments(docsData);
            setCases(casesData);
            if (casesData.length > 0) {
                setSelectedUploadCaseId(casesData[0].id);
            }
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = (docId: string) => {
        const url = documentsApi.downloadUrl(docId);
        window.open(url, "_blank");
    };

    const handleDelete = async (docId: string, docName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${docName}"?`)) return;
        try {
            await documentsApi.delete(docId);
            loadData();
        } catch (err: any) {
            console.error("Failed to delete document", err);
            alert(`Failed to delete document: ${err.message || "Unknown error"}`);
        }
    };

    const handleUploadComplete = () => {
        // Refresh local documents list
        loadData();
        // keep modal open so user can upload multiple files if they want, 
        // or we could close it. Let's close it:
        setIsUploadOpen(false);
    };

    const filteredAndSorted = useMemo(() => {
        let result = documents;

        // 1. Filter by Category
        if (activeTab !== "All") {
            const allowedExts = FILE_CATEGORIES[activeTab] || [];
            result = result.filter(d => d.file_type && allowedExts.includes(d.file_type.toLowerCase()));
        }

        // 2. Filter by Search Query
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(d => d.original_filename.toLowerCase().includes(lowerQ));
        }

        // 3. Sort
        result.sort((a, b) => {
            if (sortBy === "date_desc") {
                return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
            } else if (sortBy === "date_asc") {
                return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
            } else if (sortBy === "name_asc") {
                return a.original_filename.localeCompare(b.original_filename);
            } else if (sortBy === "name_desc") {
                return b.original_filename.localeCompare(a.original_filename);
            } else if (sortBy === "size_desc") {
                return (b.file_size || 0) - (a.file_size || 0);
            } else if (sortBy === "size_asc") {
                return (a.file_size || 0) - (b.file_size || 0);
            }
            return 0;
        });

        return result;
    }, [documents, activeTab, searchQuery, sortBy]);

    return (
        <div className="min-h-screen bg-white w-full overflow-hidden flex flex-col">
            {/* Header Area */}
            <div className="flex flex-col gap-6 px-4 md:px-8 py-8 border-b border-zinc-100/50 w-full shrink-0">
                <div className="flex flex-row items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-[28px] font-semibold text-zinc-900 font-serif tracking-tight mb-2 truncate">
                            Document Storage
                        </h1>
                        <p className="text-[13px] text-zinc-500 font-medium truncate">Manage and organise your entire file repository across all cases.</p>
                    </div>
                    {/* Top Right Upload Button */}
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center justify-center gap-2 bg-[#2d2d2d] hover:bg-black text-white px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors shadow-sm shrink-0"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Upload Document</span>
                    </button>
                </div>

                {/* Search Bar - Full width on its own line */}
                <div className="relative w-full">
                    <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search for specific documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 pr-4 py-3 w-full bg-zinc-50/50 border border-zinc-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all font-medium placeholder:text-zinc-400"
                    />
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-50 rounded-lg border border-zinc-100 w-full lg:w-fit overflow-x-auto scrollbar-none">
                        {CATEGORY_TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex shrink-0 items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${activeTab === tab
                                    ? "bg-white text-blue-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-zinc-200/50"
                                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50"
                                    }`}
                            >
                                {tab !== "All" && getIconForCategory(tab)}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="relative group w-full lg:w-fit shrink-0">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="appearance-none w-full lg:w-auto pl-4 pr-10 py-2 bg-white border border-zinc-200 rounded-lg text-[13px] font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all cursor-pointer"
                        >
                            <option value="date_desc">Newest First</option>
                            <option value="date_asc">Oldest First</option>
                            <option value="name_asc">Name (A-Z)</option>
                            <option value="name_desc">Name (Z-A)</option>
                            <option value="size_desc">Largest First</option>
                            <option value="size_asc">Smallest First</option>
                        </select>
                        <ArrowDownAZ className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="px-4 md:px-8 py-8 flex-1 overflow-y-auto w-full">
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5].map(n => (
                            <div key={n} className="bg-zinc-50 border border-zinc-100 h-40 rounded-xl"></div>
                        ))}
                    </div>
                ) : filteredAndSorted.length === 0 ? (
                    <div className="bg-zinc-50/50 border border-zinc-100 border-dashed rounded-xl p-16 flex flex-col items-center justify-center max-w-4xl mx-auto mt-10">
                        <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                            <File className="w-5 h-5" />
                        </div>
                        <h3 className="text-[15px] font-semibold text-zinc-900 mb-1">No documents found</h3>
                        <p className="text-[13px] text-zinc-500 text-center">
                            {searchQuery ? "No files matching your search criteria." : `No ${activeTab !== "All" ? activeTab : "documents"} available in the repository.`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {filteredAndSorted.map(doc => {
                            // Find category mapping purely for icon
                            let catForIcon = "All";
                            if (doc.file_type) {
                                for (const [category, exts] of Object.entries(FILE_CATEGORIES)) {
                                    if (exts.includes(doc.file_type.toLowerCase())) {
                                        catForIcon = category;
                                        break;
                                    }
                                }
                            }

                            return (
                                <div
                                    key={doc.id}
                                    onClick={() => setViewDocument(doc)}
                                    className="group relative bg-white border border-zinc-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-zinc-300 transition-all flex flex-col h-40 justify-between cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50/50 border border-blue-100/50 flex items-center justify-center text-blue-700">
                                            {getIconForCategory(catForIcon)}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownload(doc.id); }}
                                                className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-blue-50 flex items-center justify-center text-zinc-400 hover:text-blue-600 transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.original_filename); }}
                                                className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-red-50 flex items-center justify-center text-zinc-400 hover:text-red-600 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[13.5px] font-bold text-zinc-900 truncate mb-2 group-hover:text-blue-700 transition-colors" title={doc.original_filename}>
                                            {doc.original_filename}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 overflow-hidden">
                                            <span className="flex items-center shrink-0 gap-1 uppercase tracking-wider bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]"><HardDrive className="w-3 h-3" /> {doc.file_type || "File"}</span>
                                            <span className="flex items-center shrink-0 gap-1"><CalendarDays className="w-3 h-3" /> {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Upload Modal overlay */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100/50">
                            <h2 className="text-[16px] font-bold text-zinc-900 font-serif">Upload Global Document</h2>
                            <button onClick={() => setIsUploadOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-semibold text-zinc-700 block">Attach to Case (Optional)</label>
                                <select
                                    value={selectedUploadCaseId}
                                    onChange={(e) => setSelectedUploadCaseId(e.target.value)}
                                    className="w-full text-[13px] border border-zinc-200 rounded-lg px-3 py-2 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all cursor-pointer"
                                    disabled={cases.length === 0}
                                >
                                    <option value="">No specific case (Global Upload)</option>
                                    {cases.map(c => (
                                        <option key={c.id} value={c.id}>{c.title} {c.case_number ? `(${c.case_number})` : ''}</option>
                                    ))}
                                </select>
                                {cases.length === 0 && (
                                    <p className="text-[12px] text-orange-600 mt-1">You have no active cases. Document will be uploaded globally.</p>
                                )}
                            </div>

                            <div className="pt-2 border-t border-zinc-100">
                                <DocumentUpload
                                    caseId={selectedUploadCaseId || null}
                                    onUploadComplete={handleUploadComplete}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Viewer Modal */}
            {viewDocument && (
                <DocumentViewer
                    document={viewDocument}
                    onClose={() => setViewDocument(null)}
                />
            )}
        </div>
    );
}
