"use client";

import { useState, useEffect } from "react";
import { notificationsApi, NotificationItem } from "@/lib/api";
import { 
    Bell, 
    Check, 
    Trash2, 
    AlertCircle, 
    CheckCircle2, 
    Info, 
    Clock,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const data = await notificationsApi.list();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        try {
            await notificationsApi.markAsRead(id);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        try {
            await notificationsApi.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case "success": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case "warning": return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case "error": return <AlertCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-zinc-900 dark:text-white flex items-center gap-3">
                        <Bell className="w-7 h-7 text-blue-600" />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-xs py-1 px-2.5 rounded-full font-sans font-semibold">
                                {unreadCount} new
                            </span>
                        )}
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium">Activity alerts and system updates</p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-sm font-medium text-zinc-700 dark:text-zinc-300 shadow-sm self-start md:self-auto"
                    >
                        <Check className="w-4 h-4 text-emerald-500" />
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 h-[500px]">
                        <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-700 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-[500px]">
                        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-700">
                            <Bell className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No notifications yet</h3>
                        <p className="text-zinc-500 mt-1 max-w-sm">When you have alerts or updates, they will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {notifications.map((notif) => {
                            const commonClasses = `group flex items-start gap-4 p-5 transition-all outline-none ${
                                !notif.is_read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                            } ${
                                notif.link ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-800/50' : ''
                            }`;
                            
                            const innerContent = (
                                <>
                                    <div className="shrink-0 mt-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                                            !notif.is_read 
                                                ? 'bg-white dark:bg-zinc-800 border-blue-200 dark:border-blue-800 shadow-sm' 
                                                : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-100 dark:border-zinc-700'
                                        }`}>
                                            {getIcon(notif.type)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h4 className={`text-base font-semibold ${!notif.is_read ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                    {notif.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                    <span className="text-xs text-zinc-500 font-medium tracking-wide">
                                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                                {!notif.is_read && (
                                                    <button
                                                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                        className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors tooltip-trigger"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(notif.id, e)}
                                                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <p className={`mt-2 ${!notif.is_read ? 'text-zinc-700 dark:text-zinc-300 font-medium' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                            {notif.message}
                                        </p>
                                        
                                        {notif.link && (
                                            <div className="mt-3 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                                View details
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </div>
                                        )}
                                    </div>
                                    {!notif.is_read && (
                                        <div className="shrink-0 w-2.5 h-2.5 bg-blue-600 rounded-full mt-5 mr-2"></div>
                                    )}
                                </>
                            );

                            if (notif.link) {
                                return (
                                    <Link 
                                        key={notif.id} 
                                        href={notif.link}
                                        className={commonClasses}
                                        onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                    >
                                        {innerContent}
                                    </Link>
                                );
                            }

                            return (
                                <div 
                                    key={notif.id}
                                    className={commonClasses}
                                    onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                >
                                    {innerContent}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
