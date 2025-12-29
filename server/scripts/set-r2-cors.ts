import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config();

const r2S3Api = process.env.R2_S3_API || "";
const bucketName = process.env.R2_BUCKET_NAME || "";

// Sanitize endpoint
let endpoint = r2S3Api;
try {
    const url = new URL(r2S3Api);
    endpoint = url.origin;
} catch (e) {
    endpoint = r2S3Api.replace(/\/$/, "");
}

const s3Client = new S3Client({
    region: "auto",
    endpoint: endpoint,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

async function setCors() {
    console.log(`Setting CORS for bucket: ${bucketName} at ${endpoint}`);

    const corsRule = {
        CORSRules: [
            {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                AllowedOrigins: ["*"], // For production, restrict to your domains
                ExposeHeaders: ["ETag", "Content-Range"],
                MaxAgeSeconds: 3000,
            },
        ],
    };

    try {
        const command = new PutBucketCorsCommand({
            Bucket: bucketName,
            CORSConfiguration: corsRule,
        });
        await s3Client.send(command);
        console.log("✅ CORS policy updated successfully!");
    } catch (error) {
        console.error("❌ Error setting CORS:", error);
    }
}

setCors();
