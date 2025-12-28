import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Sse,
    MessageEvent,
    Logger,
    Query,
    Delete,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { VideosService } from "./videos.service";
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { fromEvent, map, Observable, merge, from } from "rxjs";
import { videoUploadOptions } from "./video-upload.config";
import { StorageService } from "../storage/storage.service";

@ApiTags("videos")
@Controller("videos")
export class VideosController {
    private readonly logger = new Logger(VideosController.name);

    constructor(
        private readonly videosService: VideosService,
        private eventEmitter: EventEmitter2,
        private storageService: StorageService
    ) {}

    @Post("init-upload")
    @ApiOperation({ summary: "Initialize a resumable multipart upload" })
    async initUpload(
        @Body()
        body: {
            title: string;
            description: string;
            fileName: string;
            contentType: string;
        }
    ) {
        const video = await this.videosService.createPlaceholder(
            body.title,
            body.description
        );
        const key = `uploads/${video.id}/${body.fileName}`;
        const uploadId = await this.storageService.startMultipartUpload(
            key,
            body.contentType
        );

        return { videoId: video.id, uploadId, key };
    }

    @Get("upload-url")
    @ApiOperation({ summary: "Get a signed URL for a specific part" })
    async getUploadUrl(
        @Query("key") key: string,
        @Query("uploadId") uploadId: string,
        @Query("partNumber") partNumber: string
    ) {
        const signedUrl = await this.storageService.getSignedUrlForPart(
            key,
            uploadId,
            Number(partNumber)
        );
        return { signedUrl };
    }

    @Post("complete-upload")
    @ApiOperation({ summary: "Complete a multipart upload" })
    async completeUpload(
        @Body()
        body: {
            videoId: string;
            uploadId: string;
            key: string;
            parts: { ETag: string; PartNumber: number }[];
        }
    ) {
        const finalUrl = await this.storageService.completeMultipartUpload(
            body.key,
            body.uploadId,
            body.parts
        );

        // Update video status and initiate background processing
        await this.videosService.finalizeUpload(body.videoId, finalUrl);

        return { success: true, videoId: body.videoId };
    }

    @Get()
    @ApiOperation({ summary: "List all videos" })
    async getAllVideos() {
        return this.videosService.findAll();
    }

    @Get(":id")
    @ApiOperation({ summary: "Get video details" })
    async getVideo(@Param("id") id: string) {
        return this.videosService.findOne(id);
    }

    @Sse(":id/progress")
    @ApiOperation({ summary: "Get real-time processing progress" })
    getProgress(@Param("id") id: string): Observable<MessageEvent> {
        this.logger.log(`[SSE] Client connecting for video: ${id}`);

        const initialEvent$ = from(this.videosService.findOne(id)).pipe(
            map((video) => {
                return {
                    data: {
                        status: video?.status || "CONNECTED",
                        progress:
                            video?.status === "READY"
                                ? 100
                                : video?.progress || 0,
                        videoId: id,
                    },
                } as MessageEvent;
            })
        );

        const progressEvents$ = fromEvent(
            this.eventEmitter,
            `video.progress.${id}`
        ).pipe(
            map((data: any) => {
                this.logger.log(
                    `[SSE] Sending update for ${id}: ${JSON.stringify(data)}`
                );
                return { data } as MessageEvent;
            })
        );

        return merge(initialEvent$, progressEvents$);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete a video" })
    async remove(@Param("id") id: string) {
        return this.videosService.remove(id);
    }
}
