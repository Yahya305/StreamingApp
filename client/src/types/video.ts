export type VideoStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export interface Video {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    hlsPath: string | null;
    status: VideoStatus;
    createdAt: string;
    updatedAt: string;
    // Temporary fields for UI consistency with existing mockups
    views?: string;
    duration?: string;
    channelName?: string;
    channelAvatarUrl?: string;
}
