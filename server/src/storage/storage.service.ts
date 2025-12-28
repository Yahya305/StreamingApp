import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFileSync } from "fs";

@Injectable()
export class StorageService {
    private s3Client: S3Client;
    private bucketName: string;

    constructor(private configService: ConfigService) {
        const rawEndpoint = this.configService.get<string>("R2_S3_API") || "";
        this.bucketName =
            this.configService.get<string>("R2_BUCKET_NAME") || "test";

        let sanitizedEndpoint = rawEndpoint;
        try {
            const url = new URL(rawEndpoint);
            sanitizedEndpoint = url.origin;
        } catch (e) {
            sanitizedEndpoint = rawEndpoint.replace(/\/$/, "");
        }

        this.s3Client = new S3Client({
            region: "auto",
            endpoint: sanitizedEndpoint,
            forcePathStyle: true,
            credentials: {
                accessKeyId:
                    this.configService.get<string>("R2_ACCESS_KEY_ID") || "",
                secretAccessKey:
                    this.configService.get<string>("R2_SECRET_ACCESS_KEY") ||
                    "",
            },
        });
    }

    async uploadFile(
        filePath: string,
        key: string,
        contentType: string
    ): Promise<string> {
        const fileBuffer = readFileSync(filePath);
        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: contentType,
            })
        );

        const publicUrl = this.configService.get<string>("R2_PUBLIC_URL");
        if (publicUrl) {
            return `${publicUrl.replace(/\/$/, "")}/${key}`;
        }
        return `${(this.configService.get<string>("R2_S3_API") || "").replace(/\/$/, "")}/${key}`;
    }

    async uploadBuffer(
        buffer: Buffer,
        key: string,
        contentType: string
    ): Promise<string> {
        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
            })
        );

        const publicUrl = this.configService.get<string>("R2_PUBLIC_URL");
        if (publicUrl) {
            return `${publicUrl.replace(/\/$/, "")}/${key}`;
        }
        return `${(this.configService.get<string>("R2_S3_API") || "").replace(/\/$/, "")}/${key}`;
    }

    async deletePrefix(prefix: string): Promise<void> {
        const listCommand = new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: prefix,
        });

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

    async startMultipartUpload(
        key: string,
        contentType: string
    ): Promise<string> {
        const command = new CreateMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType,
        });
        const response = await this.s3Client.send(command);
        return response.UploadId!;
    }

    async getSignedUrlForPart(
        key: string,
        uploadId: string,
        partNumber: number
    ): Promise<string> {
        const command = new UploadPartCommand({
            Bucket: this.bucketName,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
        });
        return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    }

    async completeMultipartUpload(
        key: string,
        uploadId: string,
        parts: { ETag: string; PartNumber: number }[]
    ): Promise<string> {
        const command = new CompleteMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
            },
        });
        await this.s3Client.send(command);

        const publicUrl = this.configService.get<string>("R2_PUBLIC_URL");
        if (publicUrl) {
            return `${publicUrl.replace(/\/$/, "")}/${key}`;
        }
        return `${(this.configService.get<string>("R2_S3_API") || "").replace(/\/$/, "")}/${key}`;
    }
}
