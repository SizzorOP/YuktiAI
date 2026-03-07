"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    casesApi,
    documentsApi,
    calendarApi,
    CaseDetail,
    DocumentItem,
    CalendarEventItem,
} from "@/lib/api";
import { DocumentUpload } from "@/components/DocumentUpload";
import {
    ArrowLeft,
    FileText,
    CalendarDays,
    Info,
    Loader2,
    Download,
    Trash2,
    Plus,
    X,
    MapPin,
    Clock,
} from "lucide-react";

type Tab = "overview" | "documents" | "calendar";

export default function CaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const caseId = params.id as string;

    const [caseData, setCaseData] = useState<CaseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [showEventForm, setShowEventForm] = useState(false);
    const [eventFormData, setEventFormData] = useState({
        title: "",
        event_type: "hearing",
        event_date: "",
        description: "",
        location: "",
    });
    const [creatingEvent, setCreatingEvent] = useState(false);

    const loadCase = async () => {
        setLoading(true);
        try {
            const data = await casesApi.get(caseId);
            setCaseData(data);
        } catch (err) {
            console.error("Failed to load case:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (caseId) loadCase();
    }, [caseId]);

    const handleDeleteDoc = async (docId: string) => {
        if (!confirm("Delete this document?")) return;
        try {
            await documentsApi.delete(docId);
            loadCase();
        } catch (err) {
            console.error("Failed to delete document:", err);
        }
    };

    const handleDeleteCase = async () => {
        if (!confirm("Are you sure you want to delete this case? This action cannot be undone and will also delete all associated documents and calendar events.")) return;
        try {
            await casesApi.delete(caseId);
            router.push("/cases");
        } catch (err) {
            console.error("Failed to delete case:", err);
            alert("Failed to delete the case. Please try again.");
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm("Delete this event?")) return;
        try {
            await calendarApi.delete(eventId);
            loadCase();
        } catch (err) {
            console.error("Failed to delete event:", err);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventFormData.title || !eventFormData.event_date) return;
        setCreatingEvent(true);
        try {
            await calendarApi.create({
                ...eventFormData,
                case_id: caseId,
            });
            setShowEventForm(false);
            setEventFormData({
                title: "",
                event_type: "hearing",
                event_date: "",
                description: "",
                location: "",
            });
            loadCase();
        } catch (err) {
            console.error("Failed to create event:", err);
        } finally {
            setCreatingEvent(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "—";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-zinc-400">
                <p className="text-lg">Case not found</p>
                <button onClick={() => router.push("/cases")} className="text-blue-500 mt-2 text-sm">
                    ← Back to Cases
                </button>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
        pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
        closed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    };

    const eventTypeColors: Record<string, string> = {
        hearing: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        deadline: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
        reminder: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    };

    const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
        { key: "overview", label: "Overview", icon: <Info className="w-4 h-4" /> },
        {
            key: "documents",
            label: "Documents",
            icon: <FileText className="w-4 h-4" />,
            count: caseData.documents.length,
        },
        {
            key: "calendar",
            label: "Calendar",
            icon: <CalendarDays className="w-4 h-4" />,
            count: caseData.calendar_events.length,
        },
    ];

    return (
        <div className="min-h-screen p-8">
            {/* Back Button */}
            <button
                onClick={() => router.push("/cases")}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Cases
            </button>

            {/* Case Header */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                {caseData.title}
                            </h1>
                            <span
                                className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusColors[caseData.status] || statusColors.active
                                    }`}
                            >
                                {caseData.status}
                            </span>
                        </div>
                        {caseData.case_number && (
                            <p className="text-sm text-zinc-500 font-mono">{caseData.case_number}</p>
                        )}
                    </div>
                    <div className="text-xs text-zinc-400">
                        <div className="flex flex-col items-end gap-2">
                            <span>Created {formatDate(caseData.created_at)}</span>
                            <button
                                onClick={handleDeleteCase}
                                className="text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1.5 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete Case
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.key
                            ? "border-blue-600 text-blue-700 dark:text-blue-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className="ml-1 px-1.5 py-0.5 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 rounded-md">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: "Client", value: caseData.client_name },
                        { label: "Court", value: caseData.court },
                        { label: "Status", value: caseData.status },
                        { label: "Last Updated", value: formatDateTime(caseData.updated_at) },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
                        >
                            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">
                                {item.label}
                            </p>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">
                                {item.value || "—"}
                            </p>
                        </div>
                    ))}
                    {caseData.description && (
                        <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">
                                Description
                            </p>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                {caseData.description}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "documents" && (
                <div className="space-y-6">
                    <DocumentUpload caseId={caseId} onUploadComplete={loadCase} />

                    {caseData.documents.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No documents uploaded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {caseData.documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 group hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                {doc.original_filename}
                                            </p>
                                            <p className="text-xs text-zinc-400">
                                                {doc.file_type?.toUpperCase()} · {formatFileSize(doc.file_size)} ·{" "}
                                                {formatDate(doc.uploaded_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={documentsApi.downloadUrl(doc.id)}
                                            className="p-2 text-zinc-400 hover:text-blue-600 transition-colors"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => handleDeleteDoc(doc.id)}
                                            className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "calendar" && (
                <div className="space-y-6">
                    <button
                        onClick={() => setShowEventForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Event
                    </button>

                    {caseData.calendar_events.length === 0 ? (
                        <div className="text-center py-12 text-zinc-400">
                            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No events scheduled</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {caseData.calendar_events.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-start justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 group hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`w-2 h-2 rounded-full mt-2 shrink-0 ${event.event_type === "hearing"
                                                ? "bg-blue-500"
                                                : event.event_type === "deadline"
                                                    ? "bg-red-500"
                                                    : "bg-amber-500"
                                                }`}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                {event.title}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1 text-xs text-zinc-400">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDateTime(event.event_date)}
                                                </span>
                                                <span
                                                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${eventTypeColors[event.event_type] || eventTypeColors.hearing
                                                        }`}
                                                >
                                                    {event.event_type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteEvent(event.id)}
                                        className="p-2 text-zinc-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Event Modal */}
                    {showEventForm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                                    <h2 className="text-lg font-semibold">Add Event</h2>
                                    <button
                                        onClick={() => setShowEventForm(false)}
                                        className="text-zinc-400 hover:text-zinc-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                            Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={eventFormData.title}
                                            onChange={(e) =>
                                                setEventFormData({ ...eventFormData, title: e.target.value })
                                            }
                                            placeholder="e.g., Next Hearing Date"
                                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                                Type
                                            </label>
                                            <select
                                                value={eventFormData.event_type}
                                                onChange={(e) =>
                                                    setEventFormData({ ...eventFormData, event_type: e.target.value })
                                                }
                                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                            >
                                                <option value="hearing">Hearing</option>
                                                <option value="deadline">Deadline</option>
                                                <option value="reminder">Reminder</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                                Date & Time *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={eventFormData.event_date}
                                                onChange={(e) =>
                                                    setEventFormData({ ...eventFormData, event_date: e.target.value })
                                                }
                                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            value={eventFormData.location}
                                            onChange={(e) =>
                                                setEventFormData({ ...eventFormData, location: e.target.value })
                                            }
                                            placeholder="e.g., Courtroom 5, Tis Hazari"
                                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={eventFormData.description}
                                            onChange={(e) =>
                                                setEventFormData({ ...eventFormData, description: e.target.value })
                                            }
                                            rows={2}
                                            placeholder="Additional notes..."
                                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowEventForm(false)}
                                            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={creatingEvent}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                                        >
                                            {creatingEvent && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            Add Event
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
