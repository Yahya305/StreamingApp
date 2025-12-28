import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env from server directory
dotenv.config({ path: path.join(__dirname, "../.env") });

const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_S3_API,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

async function setCors() {
    const bucketName = process.env.R2_BUCKET_NAME || "test";

    const response = await s3Client.send(
        new PutBucketCorsCommand({
            Bucket: bucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        // User specified origins + wildcard for safety during dev
                        AllowedOrigins: [
                            "http://localhost:3000",
                            "http://localhost:3001",
                            "http://localhost:8000",
                            "http://localhost:5173",
                            "*",
                        ],
                        AllowedMethods: [
                            "GET",
                            "PUT",
                            "POST",
                            "DELETE",
                            "HEAD",
                        ],
                        AllowedHeaders: ["*"],
                        // CRITICAL: Browser must be allowed to read ETag to complete multipart upload
                        ExposeHeaders: ["ETag", "Content-Range"],
                        MaxAgeSeconds: 3600,
                    },
                ],
            },
        })
    );

    console.log("✅ CORS updated successfully for bucket:", bucketName);
}

setCors().catch(console.error);
