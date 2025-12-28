import {
    S3Client,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_S3_API,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

async function wipe() {
    console.log("🚀 Starting R2 Storage Wipe...");

    try {
        const bucket = process.env.R2_BUCKET_NAME || "test";
        console.log(`🧹 Wiping R2 Bucket: ${bucket}...`);

        let continued = true;
        let continuationToken: string | undefined = undefined;

        while (continued) {
            const list = await s3Client.send(
                new ListObjectsV2Command({
                    Bucket: bucket,
                    ContinuationToken: continuationToken,
                })
            );

            if (list.Contents && list.Contents.length > 0) {
                const toDelete = list.Contents.map((obj) => ({ Key: obj.Key }));
                await s3Client.send(
                    new DeleteObjectsCommand({
                        Bucket: bucket,
                        Delete: { Objects: toDelete },
                    })
                );
                console.log(`✅ Deleted ${toDelete.length} objects from R2.`);
            } else {
                console.log("✅ R2 Bucket is already empty or wipe complete.");
                continued = false;
            }

            if (list.IsTruncated) {
                continuationToken = list.NextContinuationToken;
            } else {
                continued = false;
            }
        }
    } catch (error) {
        console.error("❌ Failed to clear R2:", error);
    }

    console.log("✨ R2 Storage Wipe Complete.");
}

wipe().catch(console.error);
