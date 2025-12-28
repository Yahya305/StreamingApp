import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VideoProcessorService } from './video-processor.service';
import { StorageService } from '../storage/storage.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

@Processor('video-processing')
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private prisma: PrismaService,
    private videoProcessorService: VideoProcessorService,
    private storageService: StorageService,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { videoId, filePath } = job.data;
    this.logger.log(`Processing video ${videoId}...`);

    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      this.logger.error(`Video ${videoId} not found`);
      return;
    }

    try {
      await this.prisma.video.update({
        where: { id: videoId },
        data: { status: 'PROCESSING' },
      });

      const tempOutputDir = path.join(os.tmpdir(), `video-${videoId}`);
      const processedFiles = await this.videoProcessorService.processVideo(
        filePath,
        tempOutputDir,
        (percent) => {
          this.eventEmitter.emit(`video.progress.${videoId}`, {
            videoId,
            progress: percent,
            status: 'PROCESSING',
          });
        },
      );

      this.logger.log(`Uploading ${processedFiles.length} files to R2...`);

      let masterPlaylistUrl = '';
      let thumbnailUrl = '';

      for (const file of processedFiles) {
        const relativePath = path
          .relative(tempOutputDir, file)
          .replace(/\\/g, '/');
        const key = `videos/${videoId}/${relativePath}`;
        const contentType = this.getContentType(file);

        const url = await this.storageService.uploadFile(
          file,
          key,
          contentType,
        );

        if (relativePath === 'master.m3u8') {
          masterPlaylistUrl = url;
        } else if (relativePath === 'thumbnail.jpg') {
          thumbnailUrl = url;
        }
      }

      await this.prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'READY',
          hlsPath: masterPlaylistUrl,
          thumbnailUrl: thumbnailUrl,
        },
      });

      this.logger.log(`Video ${videoId} processed and uploaded successfully.`);

      this.eventEmitter.emit(`video.progress.${videoId}`, {
        videoId,
        progress: 100,
        status: 'READY',
      });

      // Cleanup temp files
      fs.rmSync(tempOutputDir, { recursive: true, force: true });
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Original uploaded file
      }
    } catch (error) {
      this.logger.error(`Error processing video ${videoId}: ${error.message}`);
      await this.prisma.video.update({
        where: { id: videoId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.m3u8':
        return 'application/vnd.apple.mpegurl';
      case '.ts':
        return 'video/mp2t';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      default:
        return 'application/octet-stream';
    }
  }
}
