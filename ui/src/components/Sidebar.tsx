"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { notificationsApi } from "@/lib/api";
import {
    Bell,
    LayoutDashboard,
    Briefcase,
    Search,
    PenTool,
    FileText,
    Headphones,
    CalendarDays,
    BookOpen,
    PanelLeftClose,
    PanelLeftOpen,
    UserCircle,
    Languages,
    Settings,
    LifeBuoy,
    LogOut,
    ChevronUp,
    FileSignature,
} from "lucide-react";

const navigation = [
    { name: "Notifications", href: "#", icon: Bell },
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Research", href: "/research", icon: Search },
    { name: "Case Management", href: "/cases", icon: Briefcase },
    { name: "Legal Library", href: "/library", icon: BookOpen },
    { name: "Document Storage", href: "/documents", icon: FileText },
    { name: "Drafting", href: "/drafting", icon: PenTool },
    { name: "Contract Analysis", href: "/contracts", icon: FileSignature },
    { name: "Translate", href: "/translation", icon: Languages },
    { name: "Meeting Assistant", href: "/meeting", icon: Headphones },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
];

export interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    className?: string;
}

export function Sidebar({ isCollapsed, toggleSidebar, className = "" }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const displayName = profile?.full_name || "User";
    const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Close menu on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Fetch unread notifications count
    useEffect(() => {
        const fetchUnread = async () => {
            if (!profile) return;
            try {
                const data = await notificationsApi.list();
                setUnreadCount(data.filter(n => !n.is_read).length);
            } catch (error) {
                console.error("Failed to fetch notifications count", error);
            }
        };

        fetchUnread();
        
        // Set up an interval to poll for new notifications
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [pathname, profile]);

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    };

    return (
        <div className={`flex flex-col h-screen bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-[260px]'} ${className}`}>
            {/* Logo/Brand Area */}
            <div className={`flex items-center h-16 border-b border-zinc-100/50 dark:border-zinc-800 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
                {!isCollapsed && (
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="flex items-center justify-center w-7 h-7 bg-zinc-900 dark:bg-white rounded-lg shrink-0 overflow-hidden relative">
                            <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-white dark:bg-zinc-900 rounded-sm" />
                            <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-zinc-400 rounded-sm" />
                            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white dark:bg-zinc-900 rounded-full" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white font-serif">
                            YuktiAI
                        </span>
                    </Link>
                )}
                {isCollapsed && (
                    <button onClick={toggleSidebar} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800" title="Expand Sidebar">
                        <PanelLeftOpen className="w-5 h-5" />
                    </button>
                )}
                {!isCollapsed && (
                    <button onClick={toggleSidebar} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 ml-2" title="Collapse Sidebar">
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Navigation Links */}
            <div className={`flex-1 overflow-y-auto py-6 space-y-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                {/* Notifications */}
                <Link
                    href="/notifications"
                    className={`flex items-center rounded-lg text-[13px] font-medium transition-colors mb-6 ${
                        pathname === "/notifications" 
                            ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300" 
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                    } ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}`}
                    title={isCollapsed ? "Notifications" : undefined}
                >
                    <div className="relative flex items-center justify-center">
                        <Bell className={`w-4 h-4 shrink-0 ${pathname === "/notifications" ? "text-blue-700 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-500"}`} strokeWidth={2} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white dark:border-zinc-900"></span>
                            </span>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-1 items-center justify-between">
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                                <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    )}
                </Link>

                {/* Separator */}
                <div className={`h-px bg-zinc-100 dark:bg-zinc-800 my-4 ${isCollapsed ? 'mx-2' : '-mx-2'}`} />

                {navigation.slice(1).map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={isCollapsed ? item.name : undefined}
                            className={`flex items-center rounded-lg text-[13px] font-medium transition-colors ${isActive
                                ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                                } ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}`}
                        >
                            <item.icon
                                className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-700 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-500"}`}
                                strokeWidth={2}
                            />
                            {!isCollapsed && item.name}
                        </Link>
                    );
                })}
            </div>

            {/* Footer Profile with Dropdown */}
            <div className="p-4 border-t border-zinc-100/80 dark:border-zinc-800 relative" ref={menuRef}>
                {/* Dropdown Menu */}
                {menuOpen && (
                    <div className={`absolute bottom-full mb-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden z-50 ${isCollapsed ? 'left-2 w-48' : 'left-4 right-4'}`}>
                        <Link
                            href="/settings"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                        >
                            <Settings className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                            Settings
                        </Link>
                        <Link
                            href="#"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                        >
                            <LifeBuoy className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                            Support
                        </Link>
                        <div className="h-px bg-zinc-100 dark:bg-zinc-700" />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full text-left"
                        >
                            <LogOut className="w-4 h-4" />
                            Log out
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`flex items-center rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left group ${isCollapsed ? 'justify-center p-2 w-full' : 'gap-3 px-3 py-3 w-full'}`}
                    title={isCollapsed ? displayName : undefined}
                >
                    <div className={`flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all border border-blue-200/50 dark:border-blue-800/50 ${isCollapsed ? 'w-8 h-8 shrink-0' : 'w-8 h-8'}`}>
                        {initials}
                    </div>
                    {!isCollapsed && (
                        <>
                            <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 flex-1 truncate">{displayName}</span>
                            <ChevronUp className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${menuOpen ? '' : 'rotate-180'}`} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
