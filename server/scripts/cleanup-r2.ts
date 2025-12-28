import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanup() {
  const videoId = process.argv[2];

  if (!videoId) {
    console.error('Please provide a video ID as an argument.');
    process.exit(1);
  }
  const client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_S3_API?.replace(/\/test$/, ''), // Strip /test if present
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });

  const bucket = process.env.R2_BUCKET_NAME || 'test';

  console.log(
    `Searching for objects containing ID: ${videoId} in bucket: ${bucket}`,
  );

  try {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        // No prefix so we find everything regardless of nesting
      }),
    );

    if (!list.Contents) {
      console.log('No objects found in bucket.');
      return;
    }

    const toDelete = list.Contents.filter((obj) =>
      obj.Key?.includes(videoId),
    ).map((obj) => ({ Key: obj.Key }));

    if (toDelete.length === 0) {
      console.log('No matching objects found for this ID.');
      return;
    }

    console.log(`Found ${toDelete.length} objects. Deleting...`);
    toDelete.forEach((obj) => console.log(` - ${obj.Key}`));

    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: toDelete },
      }),
    );

    console.log('Successfully deleted all matching objects from R2!');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

cleanup();
