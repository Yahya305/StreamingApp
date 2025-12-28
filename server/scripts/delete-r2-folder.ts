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
    endpoint: process.env.R2_S3_API?.replace(/\/test$/, ""), // Strip bucket name from endpoint if present
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

async function deleteFolder() {
    let folderPath = process.argv[2];

    if (!folderPath) {
        console.error(
            "❌ Usage: npx ts-node scripts/delete-r2-folder.ts <folder-path>"
        );
        console.error(
            "Example: npx ts-node scripts/delete-r2-folder.ts videos/uuid-here"
        );
        process.exit(1);
    }

    // Normalize path: Remove leading slash if any
    if (folderPath.startsWith("/")) {
        folderPath = folderPath.substring(1);
    }
    // Ensure it ends with a slash if it's a folder prefix, or just use as is
    // S3 prefixes typically don't require a trailing slash but it's safer for folder matching
    const bucket = process.env.R2_BUCKET_NAME || "test";

    console.log(`🧹 Searching for objects in: ${bucket}/${folderPath}...`);

    try {
        const list = await s3Client.send(
            new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: folderPath,
            })
        );

        if (!list.Contents || list.Contents.length === 0) {
            console.log("✅ No objects found with this prefix.");
            return;
        }

        const toDelete = list.Contents.map((obj) => ({ Key: obj.Key }));

        console.log(`🗑️ Found ${toDelete.length} objects. Deleting...`);

        await s3Client.send(
            new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: { Objects: toDelete },
            })
        );

        console.log("✅ Successfully deleted folder contents.");
    } catch (error) {
        console.error("❌ Delete failed:", error);
    }
}

deleteFolder().catch(console.error);
