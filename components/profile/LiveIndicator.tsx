import { Radio } from "lucide-react";

interface LiveIndicatorProps {
    streamUrl?: string;
    size?: "sm" | "md" | "lg";
    showText?: boolean;
}

export function LiveIndicator({ streamUrl, size = "md", showText = true }: LiveIndicatorProps) {
    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-3 py-1",
        lg: "text-base px-4 py-1.5",
    };

    const dotSizes = {
        sm: "w-1.5 h-1.5",
        md: "w-2 h-2",
        lg: "w-2.5 h-2.5",
    };

    const Wrapper = streamUrl ? "a" : "div";
    const wrapperProps = streamUrl ? { href: streamUrl, target: "_blank", rel: "noopener noreferrer" } : {};

    return (
        <Wrapper
            {...wrapperProps}
            className={`inline-flex items-center gap-1.5 bg-red-500/20 text-red-400 rounded-full font-bold uppercase tracking-wider ${sizeClasses[size]} ${streamUrl ? "hover:bg-red-500/30 transition-colors cursor-pointer" : ""}`}
        >
            <span className="relative flex">
                <span className={`${dotSizes[size]} bg-red-500 rounded-full animate-ping absolute inline-flex opacity-75`} />
                <span className={`${dotSizes[size]} bg-red-500 rounded-full relative inline-flex`} />
            </span>
            {showText && (
                <>
                    <Radio className={size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"} />
                    LIVE
                </>
            )}
        </Wrapper>
    );
}
