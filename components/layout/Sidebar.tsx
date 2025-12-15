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
    LogOut
} from "lucide-react";
import { cn } from "@/utils/cn";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tournaments", href: "/dashboard/tournaments", icon: Trophy },
    { name: "My Teams", href: "/dashboard/teams", icon: Users },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="bg-midnight-800 border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-40 w-64">
            <div className="p-6 flex items-center gap-3">
                <Logo className="w-8 h-8" />
                <span className="font-bold text-xl tracking-wide text-white">PROGRID</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "text-white bg-white/5 border border-white/5"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-grid-cyan" />
                            )}
                            <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-grid-cyan" : "text-gray-500 group-hover:text-gray-300")} />
                            <span className="truncate">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
