import { Link } from "@tanstack/react-router";
import { type Video } from "@/types/video";

interface VideoCardProps {
    video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
    const isReady = video.status === "READY";
    const isFailed = video.status === "FAILED";

    return (
        <div className="flex flex-col gap-3 group cursor-pointer">
            <Link
                to="/watch/$videoId"
                params={{ videoId: video.id }}
                className={`relative aspect-video rounded-xl overflow-hidden bg-secondary ${!isReady ? "pointer-events-none" : ""}`}
            >
                {video.thumbnailUrl ? (
                    <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                )}

                {isReady && video.duration && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
                        {video.duration}
                    </div>
                )}

                {!isReady && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isFailed
                                    ? "bg-destructive text-destructive-foreground"
                                    : "bg-primary text-primary-foreground animate-pulse"
                            }`}
                        >
                            {video.status}
                        </span>
                    </div>
                )}
            </Link>

            <div className="flex gap-3 px-1">
                <div className="shrink-0 pt-1">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary">
                        <img
                            src={
                                video.channelAvatarUrl ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.id}`
                            }
                            alt={video.channelName || "Channel"}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <Link
                        to="/watch/$videoId"
                        params={{ videoId: video.id }}
                        disabled={!isReady}
                    >
                        <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {video.title}
                        </h3>
                    </Link>
                    <div className="mt-1 flex flex-col sm:block">
                        <span className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-1">
                            {video.channelName || "My Channel"}
                        </span>
                        <div className="text-xs text-muted-foreground hidden sm:inline">
                            •
                        </div>
                        <span className="text-xs text-muted-foreground ml-0 sm:ml-1">
                            {video.views || "0 views"} •{" "}
                            {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
