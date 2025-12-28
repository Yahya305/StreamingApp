import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: Redis;

    constructor(private configService: ConfigService) {}

    onModuleInit() {
        this.client = new Redis({
            host: this.configService.get<string>("REDIS_HOST", "localhost"),
            port: this.configService.get<number>("REDIS_PORT", 6379),
        });
    }

    onModuleDestroy() {
        this.client.disconnect();
    }

    getClient(): Redis {
        return this.client;
    }

    async setProgress(videoId: string, progress: number) {
        // Expire in 1 hour if not updated
        await this.client.set(
            `video:progress:${videoId}`,
            progress.toString(),
            "EX",
            3600
        );
    }

    async getProgress(videoId: string): Promise<number | null> {
        const progress = await this.client.get(`video:progress:${videoId}`);
        return progress ? parseInt(progress, 10) : null;
    }

    async deleteProgress(videoId: string) {
        await this.client.del(`video:progress:${videoId}`);
    }
}
