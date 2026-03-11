"use client";

import { useState, useEffect } from "react";
import { calendarApi, casesApi, CalendarEventItem, CaseItem } from "@/lib/api";
import {
    Calendar as CalendarIcon,
    Search,
    Plus,
    X,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Check,
} from "lucide-react";

export default function CalendarPage() {
    // Data State
    const [events, setEvents] = useState<CalendarEventItem[]>([]);
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);

    // UI State
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [caseSearchQuery, setCaseSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentView, setCurrentView] = useState("Month"); // Day, Week, Month, Year

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        category: "court", // court | non-court
        case_id: "",
        event_date: "",
        start_time: "12:00",
        end_time: "12:30",
        meeting_link: "",
        description: "",
    });

    const loadEvents = async () => {
        try {
            const data = await calendarApi.list();
            setEvents(data);
        } catch (err) {
            console.error("Failed to load events:", err);
        }
    };

    const loadCases = async () => {
        try {
            const data = await casesApi.list();
            setCases(data);
        } catch (err) {
            console.error("Failed to load cases:", err);
        }
    };

    useEffect(() => {
        loadEvents();
        loadCases();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.event_date) return;
        setCreating(true);
        try {
            const combinedDateTimeString = `${formData.event_date}T${formData.start_time}:00`;

            const payload = {
                title: formData.title,
                event_type: "hearing" as any, 
                category: formData.category,
                event_date: new Date(combinedDateTimeString).toISOString(),
                description: formData.description || undefined,
                case_id: formData.case_id || undefined,
                meeting_link: formData.category === "non-court" && formData.meeting_link ? formData.meeting_link : undefined,
                location: (formData as any).location || undefined,
            };

            if (selectedEvent) {
                await calendarApi.update(selectedEvent.id, payload);
            } else {
                await calendarApi.create(payload);
            }

            resetForm();
            loadEvents();
        } catch (err) {
            console.error("Failed to save event:", err);
            alert("Failed to save calendar event");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent) return;
        if (!confirm("Are you sure you want to delete this event?")) return;
        
        setDeleting(true);
        try {
            await calendarApi.delete(selectedEvent.id);
            resetForm();
            loadEvents();
        } catch (err) {
            console.error("Failed to delete event:", err);
            alert("Failed to delete calendar event");
        } finally {
            setDeleting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            category: "court",
            case_id: "",
            event_date: "",
            start_time: "12:00",
            end_time: "12:30",
            meeting_link: "",
            description: "",
        });
        setSelectedEvent(null);
        setShowForm(false);
    };

    const openEditForm = (event: CalendarEventItem) => {
        const date = new Date(event.event_date);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');

        setSelectedEvent(event);
        setFormData({
            title: event.title,
            category: event.category,
            case_id: event.case_id || "",
            event_date: `${yyyy}-${mm}-${dd}`,
            start_time: `${hh}:${min}`,
            end_time: "12:30", // Fallback or logic to calculate end time
            meeting_link: event.meeting_link || "",
            description: event.description || "",
        });
        setShowForm(true);
    };

    // Calendar Math Helpers
    const handlePrevMonth = () => {
        const prev = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
        setSelectedDate(prev);
    };

    const handleNextMonth = () => {
        const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
        setSelectedDate(next);
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    const daysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getCalendarDays = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const numDays = daysInMonth(month, year);
        const prevMonthDays = daysInMonth(month - 1, year);

        const days = [];

        // Previous month filler days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                isCurrentMonth: false,
                dateObj: new Date(year, month - 1, prevMonthDays - i)
            });
        }

        // Current month days
        for (let i = 1; i <= numDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                dateObj: new Date(year, month, i)
            });
        }

        // Next month filler days to complete rows of 7
        const remaining = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= remaining; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                dateObj: new Date(year, month + 1, i)
            });
        }

        return days;
    };

    const calendarGrid = getCalendarDays();
    const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local

    // Filter events for "Today" sidebar
    const todaysEvents = events.filter(e => {
        const eventDateStr = new Date(e.event_date).toLocaleDateString("en-CA");
        return eventDateStr === todayStr;
    });

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-100 flex flex-col shrink-0">
                {/* Header Logo Area */}
                <div className="h-16 flex items-center px-6 gap-3 border-b border-transparent shrink-0 mt-2">
                    <CalendarIcon className="w-5 h-5 text-gray-900" />
                    <h1 className="text-xl font-semibold text-gray-900 font-serif">Calendar</h1>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Today's Events */}
                    <div className="mb-8">
                        <h3 className="text-[13px] font-medium text-gray-700 mb-3">Today&apos;s Events</h3>
                        {todaysEvents.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-lg p-3 py-4 text-center">
                                <span className="text-sm text-gray-400">No Events for Today</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {todaysEvents.map(e => (
                                    <div 
                                        key={e.id} 
                                        onClick={() => openEditForm(e)}
                                        className="bg-gray-50 border border-gray-100 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{e.title}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(e.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Case Filters */}
                    <div>
                        <h3 className="text-[13px] italic text-gray-500 mb-3">Filter events by cases</h3>
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={caseSearchQuery}
                                onChange={(e) => setCaseSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm outline-none focus:border-gray-300 transition-colors"
                            />
                        </div>
                        <div className="mt-6 text-center text-gray-400 text-sm">
                            <p>No cases</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {/* Top Navigation */}
                <div className="h-20 flex items-center justify-between px-8 shrink-0">
                    <div className="flex-1 max-w-2xl px-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search events"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-300"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setFormData(prev => ({ ...prev, event_date: new Date().toISOString().split('T')[0] }));
                            setSelectedEvent(null);
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ml-4 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Create Event
                    </button>
                </div>

                {/* Calendar Workspace */}
                <div className="flex-1 overflow-auto p-4 px-8 pb-8">
                    <div className="bg-white border border-gray-200 rounded-xl h-full flex flex-col overflow-hidden">

                        {/* Calendar Toolbar */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                            <button
                                onClick={handleToday}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Today
                            </button>

                            <div className="flex items-center px-4 py-2 border border-gray-200 rounded-lg gap-4">
                                <button onClick={handlePrevMonth} className="text-gray-400 hover:text-gray-600">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-bold text-gray-800 min-w-[120px] text-center">
                                    {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                                <button onClick={handleNextMonth} className="text-gray-400 hover:text-gray-600">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                                {["Day", "Week", "Month", "Year"].map(view => (
                                    <button
                                        key={view}
                                        onClick={() => setCurrentView(view)}
                                        className={`px-4 py-2 text-sm font-medium transition-colors ${currentView === view
                                            ? "bg-gray-100 text-gray-800 font-semibold"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 bg-white"
                                            }`}
                                    >
                                        {view}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Calendar Header Row */}
                        <div className="grid grid-cols-7 border-b border-gray-100 shrink-0 bg-white">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-3 text-center text-[13px] font-semibold text-gray-600">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid Matrix */}
                        <div className="flex-1 grid grid-cols-7 grid-rows-6">
                            {calendarGrid.map((dayObj, idx) => {
                                const dateStrKey = dayObj.dateObj.toLocaleDateString("en-CA");
                                const isToday = dateStrKey === todayStr;

                                // Fetch any events falling on this cell
                                const dayEvents = events.filter(e => {
                                    return new Date(e.event_date).toLocaleDateString("en-CA") === dateStrKey;
                                });

                                return (
                                    <div
                                        key={idx}
                                        onClick={(e) => {
                                            // Only trigger if clicking the cell background, not an event or other relative
                                            if (e.target !== e.currentTarget) return;
                                            setFormData(prev => ({ ...prev, event_date: dateStrKey }));
                                            setSelectedEvent(null);
                                            setShowForm(true);
                                        }}
                                        className={`min-h-[100px] border-r border-b border-gray-100 p-2 cursor-pointer transition-colors
                                            ${idx % 7 === 6 ? 'border-r-0' : ''} 
                                            ${!dayObj.isCurrentMonth ? 'bg-gray-50/50' : 'hover:bg-gray-50'}
                                        `}
                                    >
                                        <div className="flex justify-end mb-1">
                                            <span className={`text-[13px] font-medium w-6 h-6 flex items-center justify-center rounded
                                                ${!dayObj.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                                                ${isToday ? 'bg-blue-600 text-white' : ''}
                                            `}>
                                                {dayObj.day}
                                            </span>
                                        </div>
                                        <div className="space-y-1 overflow-y-auto max-h-[80px]">
                                            {dayEvents.slice(0, 3).map(event => (
                                                <div
                                                    key={event.id}
                                                    title={event.title}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditForm(event);
                                                    }}
                                                    className={`event-pill px-2 py-1 text-xs truncate rounded border cursor-pointer hover:brightness-95 transition-all
                                                        ${event.category === 'non-court'
                                                            ? 'bg-orange-50 text-orange-700 border-orange-100'
                                                            : 'bg-blue-50 text-blue-700 border-blue-100'}
                                                    `}
                                                >
                                                    {new Date(event.event_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} {event.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[10px] text-gray-500 font-medium px-1">
                                                    +{dayEvents.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden relative border border-gray-100">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4">
                            <h2 className="text-lg font-bold text-gray-900 font-serif">
                                {selectedEvent ? 'Edit Event' : 'Create New Event'}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1 ml-1">Event Name*</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm outline-none focus:border-gray-800 transition-colors"
                                />
                            </div>

                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: "court" })}
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${formData.category === "court"
                                        ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Court hearing
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: "non-court" })}
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${formData.category === "non-court"
                                        ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Non Court event
                                </button>
                            </div>

                            {formData.category === "non-court" && (
                                <div>
                                    <select
                                        value={formData.meeting_link}
                                        onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-800 text-gray-700"
                                    >
                                        <option value="" disabled>Add Meeting Link</option>
                                        <option value="https://meet.google.com/new">Google Meet Integration</option>
                                        <option value="https://zoom.us/new">Zoom Integration</option>
                                        <option value="Custom">Custom Link (Type in description)</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <select
                                    value={formData.case_id}
                                    onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-800 text-gray-500"
                                >
                                    <option value="">Select Case</option>
                                    {cases.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="relative">
                                    <CalendarIcon className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.event_date}
                                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-800 rounded-xl text-sm outline-none focus:ring-1 focus:ring-gray-800"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <select
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-800 appearance-none text-gray-700"
                                    >
                                        <option value="09:00">09:00 AM</option>
                                        <option value="09:30">09:30 AM</option>
                                        <option value="10:00">10:00 AM</option>
                                        <option value="10:30">10:30 AM</option>
                                        <option value="11:00">11:00 AM</option>
                                        <option value="11:30">11:30 AM</option>
                                        <option value="12:00">12:00 PM</option>
                                        <option value="12:30">12:30 PM</option>
                                        <option value="13:00">01:00 PM</option>
                                        <option value="13:30">01:30 PM</option>
                                        <option value="14:00">02:00 PM</option>
                                    </select>
                                </div>
                                <span className="text-gray-400">—</span>
                                <div className="flex-1 relative">
                                    <select
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-800 appearance-none text-gray-700"
                                    >
                                        <option value="09:30">09:30 AM</option>
                                        <option value="10:00">10:00 AM</option>
                                        <option value="10:30">10:30 AM</option>
                                        <option value="11:00">11:00 AM</option>
                                        <option value="11:30">11:30 AM</option>
                                        <option value="12:00">12:00 PM</option>
                                        <option value="12:30">12:30 PM</option>
                                        <option value="13:00">01:00 PM</option>
                                        <option value="13:30">01:30 PM</option>
                                        <option value="14:00">02:00 PM</option>
                                        <option value="14:30">02:30 PM</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Description"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm resize-none outline-none focus:border-gray-800"
                                />
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 py-3 text-sm font-semibold text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
                                    >
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedEvent ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                        {selectedEvent ? 'Save Changes' : 'Create Event'}
                                    </button>
                                </div>

                                {selectedEvent && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors mt-2"
                                    >
                                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Delete Event
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
