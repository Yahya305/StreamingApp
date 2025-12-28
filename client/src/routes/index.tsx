import { createFileRoute } from "@tanstack/react-router";
import { VideoCard } from "@/features/videos/components/VideoCard";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Video } from "@/types/video";
import { Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/")({
    component: FeedPage,
});

function FeedPage() {
    const {
        data: videos,
        isLoading,
        error,
    } = useQuery<Video[]>({
        queryKey: ["videos"],
        queryFn: async () => {
            const response = await axios.get("http://localhost:3000/videos");
            return response.data;
        },
        refetchInterval: 5000, // Poll every 5 seconds to show processing updates
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">
                    Loading amazing videos...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-destructive">
                <AlertCircle className="w-10 h-10" />
                <p className="font-semibold">Failed to load videos</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-[1240px] mx-auto py-6">
            {!videos || videos.length === 0 ? (
                <div className="text-center py-20 bg-secondary/20 rounded-3xl border-2 border-dashed border-border">
                    <h3 className="text-xl font-bold mb-2">No videos yet</h3>
                    <p className="text-muted-foreground">
                        Be the first to upload something amazing!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                    {videos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            )}
        </div>
    );
}
