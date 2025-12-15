"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/branding/Logo";
import { signOut } from "@/app/actions/auth";
import {
    LayoutDashboard,
    Users,
    Trophy,
    Settings,
    LogOut,
    Swords,
    Calendar,
    BarChart3,
    Radio,
    User,
    Newspaper,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    CreditCard
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useState, useEffect } from "react";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Feed", href: "/feed", icon: Newspaper },
    { name: "Discover", href: "/discover", icon: Radio },
    { name: "My Teams", href: "/dashboard/teams", icon: Users },
    { name: "Connect", href: "/dashboard/connect", icon: UserPlus },
    { name: "Tournaments", href: "/dashboard/tournaments", icon: Trophy },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Matches", href: "/dashboard/matches", icon: Swords },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Load collapsed state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved !== null) {
            setIsCollapsed(JSON.parse(saved));
        }
    }, []);

    // Save collapsed state to localStorage
    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));

        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new CustomEvent("sidebar-toggle", {
            detail: { isCollapsed: newState }
        }));
    };

    return (
        <aside
            className={cn(
                "bg-midnight-800 border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className={cn("p-6 flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                <Logo className="w-8 h-8" />
                {!isCollapsed && (
                    <span className="font-bold text-xl tracking-wide text-white">PROGRID</span>
                )}
            </div>

            {/* Collapse Toggle Button */}
            <button
                onClick={toggleCollapse}
                className="mx-4 mb-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "text-white bg-white/5 shadow-[0_0_15px_rgba(0,229,255,0.1)] border border-white/5"
                                    : "text-gray-400 hover:text-white hover:bg-white/5",
                                isCollapsed && "justify-center"
                            )}
                            title={isCollapsed ? item.name : undefined}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-grid-cyan shadow-[0_0_10px_#00E5FF]" />
                            )}
                            <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-grid-cyan" : "text-gray-500 group-hover:text-gray-300")} />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <button
                    onClick={() => signOut()}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors",
                        isCollapsed && "justify-center"
                    )}
                    title={isCollapsed ? "Sign Out" : undefined}
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!isCollapsed && "Sign Out"}
                </button>
            </div>
        </aside>
    );
}
