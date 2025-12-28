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
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { VideosService } from "./videos.service";
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { fromEvent, map, Observable, merge, of, from } from "rxjs";

import { videoUploadOptions } from "./video-upload.config";

@ApiTags("videos")
@Controller("videos")
export class VideosController {
    private readonly logger = new Logger(VideosController.name);

    constructor(
        private readonly videosService: VideosService,
        private eventEmitter: EventEmitter2
    ) {}

    @Post("upload")
    @ApiOperation({ summary: "Upload a video file" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                title: { type: "string" },
                description: { type: "string" },
                video: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor("video", videoUploadOptions))
    async uploadVideo(
        @UploadedFile() file: Express.Multer.File,
        @Body("title") title: string,
        @Body("description") description: string
    ) {
        if (!file) {
            throw new BadRequestException("Video file is required");
        }
        return this.videosService.create(title, description, file);
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

        // Initial event to confirm connection and current status
        const initialEvent$ = from(this.videosService.findOne(id)).pipe(
            map((video) => {
                return {
                    data: {
                        status: video?.status || "CONNECTED",
                        progress: video?.status === "READY" ? 100 : 0,
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

    @Post(":id/delete") // Or @Delete(':id')
    @ApiOperation({ summary: "Delete a video" })
    async remove(@Param("id") id: string) {
        return this.videosService.remove(id);
    }
}
