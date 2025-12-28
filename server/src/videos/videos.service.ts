import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
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
}
