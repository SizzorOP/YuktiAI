/**
 * API client helper for YuktiAI backend.
 * All fetch calls to the FastAPI backend go through here.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Generic Helpers ─────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "API request failed");
    }
    // 204 No Content
    if (res.status === 204) return undefined as T;
    return res.json();
}

// ─── Cases ───────────────────────────────────────────────────

export interface CaseItem {
    id: string;
    title: string;
    case_number: string | null;
    client_name: string | null;
    court: string | null;
    status: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    document_count: number;
    event_count: number;
}

export interface DocumentItem {
    id: string;
    case_id: string;
    filename: string;
    original_filename: string;
    file_type: string | null;
    file_size: number | null;
    uploaded_at: string;
    transcript?: string | null;
    summary?: string | null;
}

export interface CalendarEventItem {
    id: string;
    case_id: string | null;
    case_title: string | null;
    title: string;
    event_type: string;
    event_date: string;
    category: string;
    meeting_link: string | null;
    description: string | null;
    location: string | null;
    is_reminder_sent: boolean;
    created_at: string;
}

export interface CaseDetail extends CaseItem {
    documents: DocumentItem[];
    calendar_events: CalendarEventItem[];
}

export const casesApi = {
    list: (status?: string) =>
        request<CaseItem[]>(`/api/cases${status ? `?status_filter=${status}` : ""}`),

    get: (id: string) => request<CaseDetail>(`/api/cases/${id}`),

    create: (data: {
        title: string;
        case_number?: string;
        client_name?: string;
        court?: string;
        description?: string;
    }) =>
        request<CaseItem>("/api/cases", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: Partial<CaseItem>) =>
        request<CaseItem>(`/api/cases/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        request<void>(`/api/cases/${id}`, { method: "DELETE" }),
};

// ─── Documents ───────────────────────────────────────────────

export const documentsApi = {
    listAll: () => request<DocumentItem[]>("/api/documents"),

    list: (caseId: string) =>
        request<DocumentItem[]>(`/api/cases/${caseId}/documents`),

    upload: async (file: File, caseId?: string | null): Promise<DocumentItem> => {
        const formData = new FormData();
        formData.append("file", file);
        if (caseId) {
            formData.append("case_id", caseId);
        }
        const res = await fetch(`${API_BASE}/api/documents`, {
            method: "POST",
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || "Upload failed");
        }
        return res.json();
    },

    update: (id: string, data: { case_id?: string | null }) =>
        request<DocumentItem>(`/api/documents/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    downloadUrl: (documentId: string) =>
        `${API_BASE}/api/documents/${documentId}/download`,

    delete: (documentId: string) =>
        request<void>(`/api/documents/${documentId}`, { method: "DELETE" }),

    analyzeMeeting: (documentId: string) =>
        request<DocumentItem>(`/api/documents/${documentId}/analyze`, { method: "PATCH" }),
};

// ─── Calendar Events ─────────────────────────────────────────

export const calendarApi = {
    list: (params?: { start_date?: string; end_date?: string; event_type?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.start_date) searchParams.set("start_date", params.start_date);
        if (params?.end_date) searchParams.set("end_date", params.end_date);
        if (params?.event_type) searchParams.set("event_type", params.event_type);
        const qs = searchParams.toString();
        return request<CalendarEventItem[]>(`/api/calendar/events${qs ? `?${qs}` : ""}`);
    },

    create: (data: {
        title: string;
        event_type?: string;
        event_date: string;
        category?: string;
        meeting_link?: string;
        case_id?: string;
        description?: string;
        location?: string;
    }) =>
        request<CalendarEventItem>("/api/calendar/events", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: Partial<CalendarEventItem>) =>
        request<CalendarEventItem>(`/api/calendar/events/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        request<void>(`/api/calendar/events/${id}`, { method: "DELETE" }),
};

// ─── Notifications ───────────────────────────────────────────

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    link: string | null;
    created_at: string;
}

export const notificationsApi = {
    list: () => request<NotificationItem[]>("/api/notifications"),
    
    markAsRead: (id: string) => 
        request<NotificationItem>(`/api/notifications/${id}/read`, { method: "PUT" }),
        
    markAllAsRead: () => 
        request<{message: string}>("/api/notifications/read-all", { method: "PUT" }),
        
    delete: (id: string) => 
        request<void>(`/api/notifications/${id}`, { method: "DELETE" }),
};
