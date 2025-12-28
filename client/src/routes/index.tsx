import { createFileRoute } from "@tanstack/react-router";
import { VideoCard } from "@/features/videos/components/VideoCard";
import { MOCK_VIDEOS } from "@/features/videos/data/mock-videos";

export const Route = createFileRoute("/")({
    component: FeedPage,
});

function FeedPage() {
    return (
        <div className="max-w-[1240px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                {MOCK_VIDEOS.map((video) => (
                    <VideoCard key={video.id} video={video} />
                ))}
                {/* Repeat some for scrolling */}
                {MOCK_VIDEOS.map((video) => (
                    <VideoCard key={`copy-${video.id}`} video={video} />
                ))}
            </div>
        </div>
    );
}
