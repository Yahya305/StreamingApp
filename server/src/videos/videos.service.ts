import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { StorageService } from "../storage/storage.service";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class VideosService {
    private readonly logger = new Logger(VideosService.name);

    constructor(
        private prisma: PrismaService,
        private storageService: StorageService,
        private redisService: RedisService,
        @InjectQueue("video-processing")
        private videoQueue: Queue
    ) {}

    async create(
        title: string,
        description: string,
        file: Express.Multer.File
    ) {
        const video = await this.prisma.video.create({
            data: {
                title,
                description,
                status: "PENDING",
            },
        });

        // Add processing job to queue
        await this.videoQueue.add("process-video", {
            videoId: video.id,
            filePath: file.path,
        });

        return video;
    }

    async findAll() {
        const videos = await this.prisma.video.findMany({
            orderBy: { createdAt: "desc" },
        });

        // Merge live progress from Redis for processing videos
        return Promise.all(
            videos.map(async (v) => {
                if (v.status === "PROCESSING") {
                    const progress = await this.redisService.getProgress(v.id);
                    return { ...v, progress: progress || 0 };
                }
                return { ...v, progress: v.status === "READY" ? 100 : 0 };
            })
        );
    }

    async findOne(id: string) {
        const video = await this.prisma.video.findUnique({
            where: { id },
        });

        if (video && video.status === "PROCESSING") {
            const progress = await this.redisService.getProgress(id);
            return { ...video, progress: progress || 0 };
        }

        if (video) {
            return { ...video, progress: video.status === "READY" ? 100 : 0 };
        }

        return video;
    }

    async remove(id: string) {
        const video = await this.prisma.video.findUnique({
            where: { id },
        });

        if (!video) {
            throw new NotFoundException(`Video with ID ${id} not found`);
        }

        // Delete folder from R2
        await this.storageService.deletePrefix(`videos/${id}/`);

        // Delete from DB
        return this.prisma.video.delete({
            where: { id },
        });
    }

    async createPlaceholder(title: string, description: string) {
        return this.prisma.video.create({
            data: {
                title,
                description,
                status: "PENDING",
            },
        });
    }

    async finalizeUpload(videoId: string, r2Url: string) {
        const video = await this.prisma.video.update({
            where: { id: videoId },
            data: {
                status: "PROCESSING",
                originalPath: r2Url, // Store the direct R2 URL of the uploaded MP4
            },
        });

        // Add processing job to queue with the R2 URL instead of local path
        await this.videoQueue.add("process-video", {
            videoId: video.id,
            filePath: r2Url, // In direct-to-R2, this is a URL
            isUrl: true, // Tell the processor to download it
        });

        return video;
    }
}
