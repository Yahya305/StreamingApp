import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const rawEndpoint = this.configService.get<string>('R2_S3_API') || '';
    this.bucketName =
      this.configService.get<string>('R2_BUCKET_NAME') || 'test';

    // Sanitize endpoint: Strictly use only the protocol and host.
    // This prevents any nested paths from being treated as part of the endpoint.
    let sanitizedEndpoint = rawEndpoint;
    try {
      const url = new URL(rawEndpoint);
      sanitizedEndpoint = url.origin;
    } catch (e) {
      // Fallback to basic cleaning if URL is invalid
      sanitizedEndpoint = rawEndpoint.replace(/\/$/, '');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: sanitizedEndpoint,
      forcePathStyle: true, // Recommended for R2 and custom endpoints
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '',
      },
    });
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

    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    if (publicUrl) {
      return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }
    return `${(this.configService.get<string>('R2_S3_API') || '').replace(/\/$/, '')}/${key}`;
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

    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    if (publicUrl) {
      return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }
    return `${(this.configService.get<string>('R2_S3_API') || '').replace(/\/$/, '')}/${key}`;
  }

  async deletePrefix(prefix: string): Promise<void> {
    const listCommand = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    console.log('list', listCommand);
    const list = await this.s3Client.send(listCommand);
    if (!list.Contents || list.Contents.length === 0) return;

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: list.Contents.map((obj) => ({ Key: obj.Key })),
      },
    });

    await this.s3Client.send(deleteCommand);
  }
}
