# 🎥 Video Streaming Application - Architecture & Deep Dive

Welcome to the documentation for our Video Streaming Application! This guide is designed for beginners to understand **exactly** how we built a scalable, YouTube-like video upload and streaming pipeline.

We didn't just upload a file to a folder; we built a system that handles **transcoding**, **adaptive streaming**, **queues**, and **cloud storage**.

---

## 🏗️ High-Level Architecture

Before diving into the code, let's look at the flow of data. We use a **Microservices-style** architecture (even though it's a monolith mostly) where the "Heavy Lifting" (processing video) is separated from the "API" (handling users).

![Video Streaming Architecture Diagram](client/public/FlowDiagram.svg)

---

## 🛠️ The Tech Stack (What & Why?)

| Component      | Technology               | Why we used it?                                                                           |
| -------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| **Frontend**   | React + Vite             | Fast, responsive UI.                                                                      |
| **Backend**    | NestJS                   | Robust, scalable Node.js framework. Great for structured code.                            |
| **Database**   | PostgreSQL + Prisma      | Reliable SQL database with an amazing ORM (Prisma) for type-safety.                       |
| **Queue**      | BullMQ + Redis           | Handles heavy background tasks (video processing) without freezing the main server.       |
| **Processing** | FFmpeg                   | The "Swiss Army Knife" of video and audio processing. Converts formats.                   |
| **Storage**    | Cloudflare R2            | S3-compatible object storage. Cheaper than AWS S3 and has zero egress fees!               |
| **Playback**   | HLS.js                   | Allows browsers to play HLS streams (which native HTML5 video tags often can't do alone). |
| **Status**     | SSE (Server-Sent Events) | Real-time connection to show the user "Processing 45%..." without refreshing.             |

---

## 🔍 Detailed Step-by-Step Breakdown

### 1️⃣ The Upload (Client → Server)

**The Problem:** Video files are huge (GBs). We can't just read them into memory.
**The Solution:** Streams & Multipart Uploads.

-   **Frontend (`upload.tsx`)**: We use `axios` to send the file. We attach an `onUploadProgress` listener to show the _network_ upload percentage (User's PC → Server).
-   **Backend (`videos.controller.ts`)**: We use **Multer**. Multer is middleware that takes the incoming stream and saves it to a temporary folder (`/tmp`) on the server.
    -   _Why temp?_ We don't want to keep the raw file forever. We just need it long enough to process it.

### 2️⃣ The "Fire and Forget" (Queueing)

**The Problem:** Transcoding a video takes time (minutes). If we did this in the API request, the user's browser would freeze waiting for a response.
**The Solution:** Asynchronous Processing.

-   **Backend (`videos.service.ts`)**: Once the file is safely in `/tmp`, we create a database entry with status `PENDING`.
-   **BullMQ**: We immediately add a generic "job" to our Redis queue: `{ videoId: '123', filePath: '/tmp/file-123.mp4' }`.
-   **Response**: We reply to the user: _"Got it! Here is ID 123. We are working on it."_

### 3️⃣ Real-Time Feedback (SSE)

**The Problem:** The user wants to know when the video is ready.
**The Solution:** Server-Sent Events (SSE).

-   **Frontend**: Opens a one-way connection: `new EventSource('/videos/123/progress')`.
-   **Backend**: We use `EventEmitter2`. When the background worker makes progress, it emits an event internally. The Controller catches this event and pushes it down the SSE pipe to the browser.
-   **Why SSE?** It's lighter than WebSockets and perfect for "Server notifying Client" scenarios.

### 4️⃣ The Heavy Lifting (FFmpeg & HLS)

**The Problem:** A raw `.mp4` file is hard to stream. It doesn't adjust quality if the user has slow internet.
**The Solution:** HTTP Live Streaming (HLS).

-   **Worker (`video.processor.ts`)**: A background process picks up the job.
-   **FFmpeg**: We run a complex command that splits the video into tiny 10-second chunks (`.ts` files) and creates multiple quality versions (360p, 720p, 1080p).
    -   **`master.m3u8`**: A "menu" file that tells the player which qualities are available.
    -   **`index.m3u8`**: A playlist for each specific quality.

### 5️⃣ Cloud Storage (R2)

**The Problem:** Storing videos on the server disk is bad. If the server crashes, data is lost. If we add more servers, they can't share files easily.
**The Solution:** Object Storage (Cloudflare R2).

-   **S3 Compatibility**: R2 speaks the same language as AWS S3. We use the `@aws-sdk/client-s3` library.
-   **Upload**: As FFmpeg finishes, we upload all those `.ts` chunks and `.m3u8` playlists to R2.
-   **Organization**: We store them neatly: `videos/{videoId}/v0/segment001.ts`.

### 6️⃣ Cleanup & Public Access

-   **Cleanup**: Once uploaded, we delete the file from the server's `/tmp` folder to save space.
-   **Public URL**: R2 gives us a public URL (e.g., `https://pub-xyz.r2.dev`). We generate the full URL for the `master.m3u8` and save it to the database:
    -   `hlsPath`: `https://pub-xyz.r2.dev/videos/123/master.m3u8`

### 7️⃣ Playback (The Finale)

-   **Frontend (`watch.tsx`)**: When the user goes to watch the video, we fetch the video details.
-   **HLS.js**: We attach the `hls.js` library to the `<video>` element. It reads the `master.m3u8`, checks the user's internet speed, and automatically picks the best quality chunk to download next.

---

## 🚀 How to Run It

1. **Start Services** (Postgres & Redis):
    ```bash
    docker compose up -d postgres redis
    ```
2. **Setup Env**:
   Make sure you have `.env` with `R2_` credentials and `DATABASE_URL`.
3. **Run Server**:
    ```bash
    cd server
    npx prisma migrate dev
    npm run start:dev
    ```
4. **Run Client**:
    ```bash
    cd client
    npm run dev
    ```

Happy Streaming! 🍿
