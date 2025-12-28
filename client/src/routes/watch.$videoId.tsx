import { createFileRoute } from "@tanstack/react-router";
import {
    ThumbsUp,
    ThumbsDown,
    Share2,
    Download,
    MoreHorizontal,
    UserCheck,
} from "lucide-react";
import { MOCK_VIDEOS } from "@/features/videos/data/mock-videos";

export const Route = createFileRoute("/watch/$videoId")({
    component: WatchPage,
});

function WatchPage() {
    const { videoId } = Route.useParams();
    const video = MOCK_VIDEOS.find((v) => v.id === videoId) || MOCK_VIDEOS[0];

    return (
        <div className="max-w-[1700px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">
                {/* Video Player Placeholder */}
                <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                            <div className="w-8 h-8 bg-primary rounded-full" />
                        </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-white p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm font-medium">
                            Video Player Interface will be implemented here
                            (ABR/HLS)
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-xl font-bold leading-tight md:text-2xl">
                        {video.title}
                    </h1>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                                <img
                                    src={video.channelAvatarUrl}
                                    alt={video.channelName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm md:text-base flex items-center gap-1">
                                    {video.channelName}
                                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    1.2M subscribers
                                </p>
                            </div>
                            <button className="ml-2 px-4 py-2 bg-foreground text-background rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
                                Subscribe
                            </button>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            <div className="flex items-center bg-secondary rounded-full">
                                <button className="flex items-center gap-2 px-4 py-2 hover:bg-accent border-r border-border first:rounded-l-full">
                                    <ThumbsUp className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        12K
                                    </span>
                                </button>
                                <button className="px-4 py-2 hover:bg-accent last:rounded-r-full">
                                    <ThumbsDown className="w-4 h-4" />
                                </button>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full hover:bg-accent transition-colors">
                                <Share2 className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    Share
                                </span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full hover:bg-accent transition-colors">
                                <Download className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    Download
                                </span>
                            </button>
                            <button className="p-2 bg-secondary rounded-full hover:bg-accent transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-secondary/40 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <span>{video.views}</span>
                            <span>{video.createdAt}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {video.description || "No description available."}
                        </p>
                        <button className="text-sm font-bold mt-2 hover:underline">
                            Show more
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-lg mb-2">Recommended for you</h3>
                {MOCK_VIDEOS.map((rec) => (
                    <div
                        key={rec.id}
                        className="flex gap-3 group cursor-pointer"
                    >
                        <div className="w-40 aspect-video rounded-lg overflow-hidden bg-secondary shrink-0 relative">
                            <img
                                src={rec.thumbnailUrl}
                                alt={rec.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-[10px] font-medium text-white rounded">
                                {rec.duration}
                            </div>
                        </div>
                        <div className="flex flex-col py-0.5">
                            <h4 className="text-sm font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                {rec.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                {rec.channelName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {rec.views} • {rec.createdAt}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
