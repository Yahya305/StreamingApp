import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('video-processing')
    private videoQueue: Queue,
  ) {}

  async create(title: string, description: string, file: Express.Multer.File) {
    const video = await this.prisma.video.create({
      data: {
        title,
        description,
        status: 'PENDING',
      },
    });

    // Add processing job to queue
    await this.videoQueue.add('process-video', {
      videoId: video.id,
      filePath: file.path,
    });

    return video;
  }

  async findAll() {
    return this.prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.video.findUnique({
      where: { id },
    });
  }
}
