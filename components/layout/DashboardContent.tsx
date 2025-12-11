"use client";

import { useState, useEffect } from "react";
import { cn } from "@/utils/cn";

export function DashboardContent({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        // Load sidebar collapsed state from localStorage
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved !== null) {
            setIsCollapsed(JSON.parse(saved));
        }

        // Listen for storage changes (when sidebar is toggled)
        const handleStorageChange = () => {
            const saved = localStorage.getItem("sidebar-collapsed");
            if (saved !== null) {
                setIsCollapsed(JSON.parse(saved));
            }
        };

        window.addEventListener("storage", handleStorageChange);

        // Custom event for same-tab updates
        const handleSidebarToggle = (e: CustomEvent) => {
            setIsCollapsed(e.detail.isCollapsed);
        };

        window.addEventListener("sidebar-toggle" as any, handleSidebarToggle as any);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("sidebar-toggle" as any, handleSidebarToggle as any);
        };
    }, []);

    return (
        <main
            className={cn(
                "flex-1 p-8 overflow-y-auto h-screen transition-all duration-300",
                isCollapsed ? "ml-20" : "ml-64"
            )}
        >
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
    );
}
