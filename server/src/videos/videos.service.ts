import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoStatus } from './video.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @InjectRepository(Video)
    private videoRepository: Repository<Video>,
    @InjectQueue('video-processing')
    private videoQueue: Queue,
  ) {}

  async create(
    title: string,
    description: string,
    file: Express.Multer.File,
  ): Promise<Video> {
    const video = this.videoRepository.create({
      title,
      description,
      originalFileName: file.originalname,
      status: VideoStatus.PENDING,
    });

    const savedVideo = await this.videoRepository.save(video);

    // Add processing job to queue
    await this.videoQueue.add('process-video', {
      videoId: savedVideo.id,
      filePath: file.path,
    });

    return savedVideo;
  }

  async findAll(): Promise<Video[]> {
    return this.videoRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Video | null> {
    return this.videoRepository.findOneBy({ id: id as any });
  }
}
