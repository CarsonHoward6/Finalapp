import { LucideProps } from "lucide-react";

export function Logo({ className, ...props }: LucideProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            {/* Bracket Structure (Left) */}
            <path d="M3 4 h 4" className="text-gray-400" />
            <path d="M7 4 v 8" className="text-gray-400" />
            <path d="M7 12 h 4" className="text-gray-400" />

            <path d="M3 20 h 4" className="text-gray-400" />
            <path d="M7 20 v -8" className="text-gray-400" />

            <path d="M11 12 h 2" className="text-gray-400" />

            {/* Play/Live Element (Right/Center Overlay) */}
            <circle cx="18" cy="12" r="5" className="text-grid-cyan" strokeWidth="2" />
            <path d="M17 10 L17 14 L20 12 Z" className="text-electric-blue fill-electric-blue" stroke="none" />

            {/* Optional dot for connection */}
            <circle cx="3" cy="4" r="1" className="fill-gray-500 stroke-none" />
            <circle cx="3" cy="20" r="1" className="fill-gray-500 stroke-none" />
        </svg>
    );
}
