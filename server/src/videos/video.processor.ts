import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoStatus } from './video.entity';
import { VideoProcessorService } from './video-processor.service';
import { StorageService } from '../storage/storage.service';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

@Processor('video-processing')
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    private videoProcessorService: VideoProcessorService,
    private storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { videoId, filePath } = job.data;
    this.logger.log(`Processing video ${videoId}...`);

    const video = await this.videoRepository.findOneBy({ id: videoId });
    if (!video) {
      this.logger.error(`Video ${videoId} not found`);
      return;
    }

    try {
      video.status = VideoStatus.PROCESSING;
      await this.videoRepository.save(video);

      const tempOutputDir = path.join(os.tmpdir(), `video-${videoId}`);
      const processedFiles = await this.videoProcessorService.processVideo(
        filePath,
        tempOutputDir,
      );

      this.logger.log(`Uploading ${processedFiles.length} files to R2...`);

      let masterPlaylistUrl = '';

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
        }
      }

      video.status = VideoStatus.READY;
      video.masterPlaylistUrl = masterPlaylistUrl;
      await this.videoRepository.save(video);

      this.logger.log(`Video ${videoId} processed and uploaded successfully.`);

      // Cleanup temp files
      fs.rmSync(tempOutputDir, { recursive: true, force: true });
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Original uploaded file
      }
    } catch (error) {
      this.logger.error(`Error processing video ${videoId}: ${error.message}`);
      video.status = VideoStatus.FAILED;
      await this.videoRepository.save(video);
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
      default:
        return 'application/octet-stream';
    }
  }
}
