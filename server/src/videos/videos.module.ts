import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './video.entity';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { VideoProcessorService } from './video-processor.service';
import { StorageModule } from '../storage/storage.module';

import { BullModule } from '@nestjs/bullmq';
import { VideoProcessor } from './video.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    StorageModule,
    BullModule.registerQueue({
      name: 'video-processing',
    }),
  ],
  controllers: [VideosController],
  providers: [VideosService, VideoProcessorService, VideoProcessor],
})
export class VideosModule {}
