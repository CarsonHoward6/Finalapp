"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export function FloatingDashboardButton() {
    return (
        <Link
            href="/dashboard"
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-electric-blue hover:bg-electric-blue/80 text-white rounded-full shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] flex items-center justify-center transition-all duration-300 hover:scale-110 group"
            title="Go to Dashboard"
        >
            <LayoutDashboard className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </Link>
    );
}
