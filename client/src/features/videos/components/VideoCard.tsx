import { Link } from "@tanstack/react-router";
import { type Video } from "../data/mock-videos";

interface VideoCardProps {
    video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
    return (
        <div className="flex flex-col gap-3 group cursor-pointer">
            <Link
                to="/watch/$videoId"
                params={{ videoId: video.id }}
                className="relative aspect-video rounded-xl overflow-hidden bg-secondary"
            >
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
                    {video.duration}
                </div>
            </Link>

            <div className="flex gap-3 px-1">
                <Link to="/" className="shrink-0 pt-1">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary">
                        <img
                            src={video.channelAvatarUrl}
                            alt={video.channelName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </Link>

                <div className="flex flex-col">
                    <Link to="/watch/$videoId" params={{ videoId: video.id }}>
                        <h3 className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {video.title}
                        </h3>
                    </Link>
                    <div className="mt-1 flex flex-col sm:block">
                        <Link
                            to="/"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-1"
                        >
                            {video.channelName}
                        </Link>
                        <div className="text-xs text-muted-foreground hidden sm:inline">
                            •
                        </div>
                        <span className="text-xs text-muted-foreground ml-0 sm:ml-1">
                            {video.views} • {video.createdAt}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
