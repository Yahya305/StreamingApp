import { Injectable, Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class VideoProcessorService {
  private readonly logger = new Logger(VideoProcessorService.name);

  async processVideo(inputPath: string, outputDir: string): Promise<string[]> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate thumbnail
    await this.extractThumbnail(inputPath, outputDir);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-filter_complex',
          '[0:v]split=3[v1][v2][v3];' +
            '[v1]scale=w=1920:h=1080[v1out];' +
            '[v2]scale=w=1280:h=720[v2out];' +
            '[v3]scale=w=640:h=360[v3out]',
          '-map [v1out]',
          '-map 0:a',
          '-map [v2out]',
          '-map 0:a',
          '-map [v3out]',
          '-map 0:a',
          '-c:v libx264',
          '-preset fast',
          '-c:a aac',
          '-ac 2',
          '-f hls',
          '-hls_time 10',
          '-hls_playlist_type vod', // Changed to vod for static content
          '-hls_segment_filename',
          path.join(outputDir, 'v%v/segment%03d.ts'),
          '-master_pl_name master.m3u8',
          '-var_stream_map',
          'v:0,a:0 v:1,a:1 v:2,a:2',
        ])
        .output(path.join(outputDir, 'v%v/index.m3u8'))
        .on('start', (commandLine) => {
          this.logger.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('progress', (progress) => {
          this.logger.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', () => {
          this.logger.log('Processing finished !');
          const files = this.getAllFiles(outputDir);
          resolve(files);
        })
        .on('error', (err) => {
          this.logger.error('An error occurred: ' + err.message);
          reject(err);
        })
        .run();
    });
  }

  private extractThumbnail(
    inputPath: string,
    outputDir: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: 'thumbnail.jpg',
          folder: outputDir,
          size: '1280x720',
        })
        .on('end', () => {
          this.logger.log('Thumbnail generated');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error('Error generating thumbnail: ' + err.message);
          reject(err);
        });
    });
  }

  private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(fullPath);
      }
    });

    return arrayOfFiles;
  }
}
