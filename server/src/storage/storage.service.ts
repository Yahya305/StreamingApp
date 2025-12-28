import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
} from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: this.configService.get<string>('R2_S3_API'),
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '',
      },
    });
    this.bucketName =
      this.configService.get<string>('R2_BUCKET_NAME') || 'test';
  }

  async uploadFile(
    filePath: string,
    key: string,
    contentType: string,
  ): Promise<string> {
    const fileBuffer = readFileSync(filePath);
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      }),
    );

    return `${this.configService.get<string>('R2_S3_API')}/${key}`;
  }

  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return `${this.configService.get<string>('R2_S3_API')}/${key}`;
  }
}
