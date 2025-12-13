import { Twitch, Youtube, Video } from "lucide-react";

export function StreamPlayer({ url }: { url: string }) {
    if (!url) return null;

    let embedUrl = "";
    let type: "twitch" | "youtube" | "unknown" = "unknown";

    // Simple Heuristics for Twitch vs YouTube
    if (url.includes("twitch.tv") || !url.includes(".")) { // Assume plain text is twitch username
        // Extract username if URL
        let channel = url;
        if (url.includes("twitch.tv/")) {
            channel = url.split("twitch.tv/")[1].split("/")[0].split("?")[0];
        }
        embedUrl = `https://player.twitch.tv/?channel=${channel}&parent=${process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost'}`;
        type = "twitch";
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        // Extract Video ID
        let videoId = "";
        if (url.includes("v=")) {
            videoId = url.split("v=")[1].split("&")[0];
        } else if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1].split("?")[0];
        }
        if (videoId) {
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            type = "youtube";
        }
    }

    if (type === "unknown" || !embedUrl) {
        return (
            <div className="aspect-video w-full bg-midnight-900 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-gray-500">
                <Video className="w-12 h-12 mb-4 opacity-50" />
                <p>Unsupported stream URL format.</p>
                <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 text-grid-cyan hover:underline">
                    Open Link
                </a>
            </div>
        );
    }

    return (
        <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
            <iframe
                src={embedUrl}
                className="w-full h-full"
                allowFullScreen
                title={`${type} stream`}
            ></iframe>
        </div>
    );
}
