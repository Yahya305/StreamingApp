# 🎥 Video Streaming Application - Architecture & Deep Dive

Welcome to the documentation for our Video Streaming Application! This guide is designed for beginners to understand **exactly** how we built a scalable, YouTube-like video upload and streaming pipeline.

We didn't just upload a file to a folder; we built a system that handles **transcoding**, **adaptive streaming**, **queues**, and **cloud storage**.

---

## 🏗️ High-Level Architecture

We use a **High-Performance Direct-to-Storage** architecture. Instead of the server acting as a middleman for large video files, the browser communicates directly with Cloudflare R2 for uploads, while the server coordinates the process and handles background transcoding.

![Video Streaming Architecture Diagram](client/public/FlowDiagram.svg)

---

## 🛠️ The Tech Stack (What & Why?)

| Component            | Technology               | Why we used it?                                                                     |
| -------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| **Frontend**         | React + Vite             | Fast, responsive UI with `axios` for chunking and `hls.js` for playback.            |
| **Backend**          | NestJS                   | Provides the API and coordinates R2/Redis/Postgres interactions.                    |
| **Database**         | PostgreSQL + Prisma      | Stores stable metadata (titles, status, paths). No redundant hot-writes.            |
| **Caching/Hot Data** | **Redis (IOREDIS)**      | **Crucial for performance.** Tracks real-time transcoding progress and powers jobs. |
| **Processing**       | FFmpeg                   | Transcodes raw MP4s into Adaptive HLS streams (360p, 720p, 1080p).                  |
| **Storage**          | Cloudflare R2            | S3-compatible, ZERO egress fees. Perfect for video delivery.                        |
| **Status**           | SSE (Server-Sent Events) | Pushes live progress from Redis to your browser instantly.                          |

---

## 🔍 Detailed Step-by-Step Breakdown

### 1️⃣ Resumable Chunked Upload (Client → R2)

**The Problem:** Uploading 5GB files in one go leads to timeouts.
**The Solution:** 10MB Chunking & Local Tracking.

-   **Fingerprinting**: We use the file's name, size, and last modified date to create a unique ID.
-   **Direct Upload**: We use **Cloudflare R2 Multipart Upload**. The server only generates "Permission Tokens" (Signed URLs) while the browser does the heavy lifting.
-   **Resumption**: If your internet cuts out at 70%, the app checks `localStorage` and only uploads the remaining chunks.

### 2️⃣ Redis-Powered Progress Tracking

**The Problem:** Updating a database table every second to show "45%, 46%, 47%..." is a bottleneck.
**The Solution:** Redis Hybrid Architecture.

-   **Hot Data (Redis)**: As FFmpeg works, it updates a simple key-value pair in Redis. This is incredibly fast and saves the database from thousands of unnecessary "Write" queries.
-   **Stable Data (Postgres)**: We only update the database once at the very end (status: `READY`).
-   **The Result**: A blazing fast UI that doesn't slow down the main database.

### 3️⃣ Adaptive Bitrate (HLS)

-   We convert your video into **HLS (HTTP Live Streaming)**.
-   Instead of one big file, we serve thousands of 2-second segments.
-   The player automatically switches between 360p (Low) and 1080p (High) based on the user's internet speed—exactly like YouTube.

### 4️⃣ Cleanup & Storage Efficiency

-   **Original Cleanup**: Once the HLS version (the streamable one) is ready, we **delete the original MP4** from R2 to keep costs low.
-   **Surgical Cleanup**: We've implemented specialist scripts to wipe old test folders and sync the database schema.

---

## ☁️ Cloudflare R2 Configuration (Dashboard Steps)

To make everything work, you **must** configure your R2 bucket correctly in the Cloudflare Dashboard.

### 1️⃣ Create a Bucket

-   Go to R2 > **Create Bucket**.
-   Name it (e.g., `streaming-app-bucket`) and copy this into your `.env` as `R2_BUCKET_NAME`.

### 2️⃣ Generate API Tokens

-   Go to R2 > **Manage R2 API Tokens** > **Create API Token**.
-   **Permissions**: Select **Admin Read/Write**.
-   **TTL**: Preferably `Forever`.
-   Copy the `Access Key ID` and `Secret Access Key` into your `.env`.

### 3️⃣ ⚠️ Critical: CORS & ETag Configuration

For **Resumable Uploads** to work, the browser must be able to see the `ETag` header from R2.

-   Go to your Bucket > **Settings** > **CORS Policy**.
-   Add the following JSON (or use our `set-r2-cors.ts` script):

```json
[
    {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag", "Content-Range"],
        "MaxAgeSeconds": 3600
    }
]
```

> [!IMPORTANT]
> Without `ExposeHeaders: ["ETag"]`, the Resumable Upload logic will fail silently because it won't be able to track finished parts!

### 4️⃣ Enable Public Access (Optional for Playback)

-   If you aren't using a custom domain, go to **Settings** > **Public Bucket UI** and enable the **R2.dev subdomain**.
-   Copy the `Public Bucket URL` into your `.env` as `R2_PUBLIC_URL`.

---

## 🚀 How to Run It

1. **Start Services** (Postgres & Redis):
    ```bash
    docker compose up -d postgres redis
    ```
2. **Setup Env**:
   Add `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_S3_API`, and `R2_BUCKET_NAME` to your server `.env`.
3. **Database Setup**:
    ```bash
    cd server
    npx prisma migrate dev
    npx prisma generate
    ```
4. **Run Everything**:
    - **Server**: `npm run start:dev` (in `server` folder)
    - **Client**: `npm run dev` (in `client` folder)

Happy Streaming! 🍿
