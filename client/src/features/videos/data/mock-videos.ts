export interface Video {
    id: string;
    title: string;
    thumbnailUrl: string;
    channelName: string;
    channelAvatarUrl: string;
    views: string;
    createdAt: string;
    duration: string;
    description?: string;
}

export const MOCK_VIDEOS: Video[] = [
    {
        id: "1",
        title: "Building a High-Performance Streaming Platform from Scratch",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
        channelName: "CodeWithMe",
        channelAvatarUrl:
            "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        views: "1.2M views",
        createdAt: "2 days ago",
        duration: "15:20",
        description:
            "Learn how to build a scalable video streaming service using modern web technologies, ABR, and FFmpeg.",
    },
    {
        id: "2",
        title: "The Future of Web Development in 2026",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
        channelName: "TechTalks",
        channelAvatarUrl:
            "https://api.dicebear.com/7.x/avataaars/svg?seed=Anya",
        views: "850K views",
        createdAt: "5 hours ago",
        duration: "10:45",
        description:
            "Exploring the latest trends and tools that will shape the web development landscape in the coming year.",
    },
    {
        id: "3",
        title: "Mastering React 19 and TanStack Router",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
        channelName: "ReactTips",
        channelAvatarUrl:
            "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
        views: "200K views",
        createdAt: "1 week ago",
        duration: "22:15",
        description:
            "A deep dive into the new features of React 19 and how to use TanStack Router for type-safe routing.",
    },
    {
        id: "4",
        title: "Why Low Latency Matters for Live Streaming",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
        channelName: "StreamEngineer",
        channelAvatarUrl:
            "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
        views: "50K views",
        createdAt: "3 days ago",
        duration: "12:30",
        description:
            "Understanding the technical challenges of achieving ultra-low latency in live video delivery.",
    },
];
