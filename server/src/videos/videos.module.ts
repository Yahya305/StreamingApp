import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { BullModule } from '@nestjs/bullmq';
import { VideoProcessor } from './video.processor';
import { VideoProcessorService } from './video-processor.service';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'video-processing',
    }),
    StorageModule,
    PrismaModule,
  ],
  controllers: [VideosController],
  providers: [VideosService, VideoProcessor, VideoProcessorService],
  exports: [VideosService],
})
export class VideosModule {}
