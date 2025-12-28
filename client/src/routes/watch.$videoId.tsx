import { createFileRoute } from "@tanstack/react-router";
import {
    ThumbsUp,
    ThumbsDown,
    Share2,
    MoreHorizontal,
    UserCheck,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { type Video } from "@/types/video";

export const Route = createFileRoute("/watch/$videoId")({
    component: WatchPage,
});

function WatchPage() {
    const { videoId } = Route.useParams();
    const videoRef = useRef<HTMLVideoElement>(null);

    const {
        data: video,
        isLoading,
        error,
    } = useQuery<Video>({
        queryKey: ["video", videoId],
        queryFn: async () => {
            const response = await axios.get(
                `http://localhost:3000/videos/${videoId}`
            );
            return response.data;
        },
    });

    const { data: recommendations } = useQuery<Video[]>({
        queryKey: ["videos"],
        queryFn: async () => {
            const response = await axios.get("http://localhost:3000/videos");
            return response.data;
        },
    });

    useEffect(() => {
        if (video?.hlsPath && videoRef.current) {
            const hls = new Hls();
            if (Hls.isSupported()) {
                hls.loadSource(video.hlsPath);
                hls.attachMedia(videoRef.current);
            } else if (
                videoRef.current.canPlayType("application/vnd.apple.mpegurl")
            ) {
                videoRef.current.src = video.hlsPath;
            }
            return () => {
                hls.destroy();
            };
        }
    }, [video?.hlsPath]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">
                    Loading video...
                </p>
            </div>
        );
    }

    if (error || !video) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-destructive px-4 text-center">
                <AlertCircle className="w-10 h-10" />
                <p className="font-semibold text-lg">Oops! Video not found</p>
                <p className="text-sm text-muted-foreground">
                    It might still be processing or has been removed.
                </p>
                <button
                    onClick={() => window.history.back()}
                    className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[1700px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6 py-6 px-4">
            <div className="xl:col-span-2 space-y-4">
                <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
                    <video
                        ref={videoRef}
                        controls
                        className="w-full h-full"
                        poster={video.thumbnailUrl || undefined}
                    />
                </div>

                <div className="space-y-4">
                    <h1 className="text-xl font-bold leading-tight md:text-2xl">
                        {video.title}
                    </h1>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
                                <img
                                    src={
                                        video.channelAvatarUrl ||
                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.id}`
                                    }
                                    alt={video.channelName || "Channel"}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm md:text-base flex items-center gap-1">
                                    {video.channelName || "My Channel"}
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
                            <button className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full hover:bg-accent transition-colors shrink-0">
                                <Share2 className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    Share
                                </span>
                            </button>
                            <button className="p-2 bg-secondary rounded-full hover:bg-accent transition-colors shrink-0">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-secondary/40 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <span>{video.views || "0 views"}</span>
                            <span>
                                {new Date(video.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {video.description || "No description available."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-lg mb-2">Recommended for you</h3>
                {recommendations
                    ?.filter((r) => r.id !== videoId)
                    .map((rec) => (
                        <div
                            key={rec.id}
                            className="flex gap-3 group cursor-pointer"
                            onClick={() =>
                                (window.location.href = `/watch/${rec.id}`)
                            }
                        >
                            <div className="w-40 aspect-video rounded-lg overflow-hidden bg-secondary shrink-0 relative">
                                {rec.thumbnailUrl ? (
                                    <img
                                        src={rec.thumbnailUrl}
                                        alt={rec.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    </div>
                                )}
                                {rec.duration && (
                                    <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-[10px] font-medium text-white rounded">
                                        {rec.duration}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col py-0.5">
                                <h4 className="text-sm font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                    {rec.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {rec.channelName || "My Channel"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {rec.views || "0 views"} •{" "}
                                    {new Date(
                                        rec.createdAt
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
