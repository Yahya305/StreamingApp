import { createFileRoute } from "@tanstack/react-router";
import { Upload, X, Film, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

export const Route = createFileRoute("/upload")({
    component: UploadPage,
});

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

function UploadPage() {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            setFile(droppedFile);
            if (!title) setTitle(droppedFile.name.split(".")[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (!title) setTitle(selectedFile.name.split(".")[0]);
        }
    };

    // Calculate fingerprint to identify file for resume
    const getFileFingerprint = (file: File) => {
        return `${file.name}-${file.size}-${file.lastModified}`;
    };

    const handleUpload = async () => {
        if (!file || !title) return;

        setUploading(true);
        const fingerprint = getFileFingerprint(file);
        const savedUpload = localStorage.getItem(`upload_${fingerprint}`);
        let { videoId, uploadId, key, uploadedParts } = savedUpload
            ? JSON.parse(savedUpload)
            : { videoId: null, uploadId: null, key: null, uploadedParts: [] };

        try {
            // 1. Initialize or Resume Upload
            if (!uploadId) {
                const initRes = await axios.post(
                    "http://localhost:3000/videos/init-upload",
                    {
                        title,
                        description,
                        fileName: file.name,
                        contentType: file.type || "video/mp4",
                    }
                );
                videoId = initRes.data.videoId;
                uploadId = initRes.data.uploadId;
                key = initRes.data.key;

                localStorage.setItem(
                    `upload_${fingerprint}`,
                    JSON.stringify({
                        videoId,
                        uploadId,
                        key,
                        uploadedParts: [],
                    })
                );
            }

            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            const parts = [...uploadedParts];

            // 2. Upload Chunks
            for (let i = 0; i < totalChunks; i++) {
                const partNumber = i + 1;

                // Skip if already uploaded
                if (parts.find((p) => p.PartNumber === partNumber)) {
                    continue;
                }

                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                // Get Signed URL
                const urlRes = await axios.get(
                    "http://localhost:3000/videos/upload-url",
                    {
                        params: { key, uploadId, partNumber },
                    }
                );

                // Direct PUT to R2
                const uploadRes = await axios.put(
                    urlRes.data.signedUrl,
                    chunk,
                    {
                        headers: { "Content-Type": file.type || "video/mp4" },
                        onUploadProgress: (p) => {
                            const chunkProgress =
                                (p.loaded / (p.total || 1)) * 100;
                            const overallProgress = Math.round(
                                ((i + chunkProgress / 100) / totalChunks) * 100
                            );
                            setProgress(overallProgress);
                        },
                    }
                );

                const etag = uploadRes.headers.etag;
                parts.push({ ETag: etag, PartNumber: partNumber });

                // Save progress
                localStorage.setItem(
                    `upload_${fingerprint}`,
                    JSON.stringify({
                        videoId,
                        uploadId,
                        key,
                        uploadedParts: parts,
                    })
                );
            }

            // 3. Complete Upload
            setProgress(100);
            await axios.post("http://localhost:3000/videos/complete-upload", {
                videoId,
                uploadId,
                key,
                parts,
            });

            localStorage.removeItem(`upload_${fingerprint}`);
            setUploading(false);
            startProcessingStatus(videoId);
        } catch (error) {
            console.error("Upload failed", error);
            alert(
                "Upload failed. Don't worry, you can resume by selecting the same file again!"
            );
            setUploading(false);
        }
    };

    const startProcessingStatus = (videoId: string) => {
        setProcessing(true);
        const eventSource = new EventSource(
            `http://localhost:3000/videos/${videoId}/progress`
        );

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setProcessingProgress(data.progress);

            if (data.status === "READY") {
                eventSource.close();
                setProcessing(false);
                setProcessingProgress(0);
                setFile(null);
                setTitle("");
                setDescription("");
                alert("Video is ready! 🚀");
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
            // We don't alert here to avoid annoying users if connection blips
        };
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Upload Video</h1>
                <button
                    onClick={() => {
                        setFile(null);
                        setTitle("");
                        setDescription("");
                    }}
                    className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                            dragActive
                                ? "border-primary bg-primary/5"
                                : "border-border"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading || processing}
                        />
                        {file ? (
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                    <Film className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg line-clamp-1 px-4">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {(file.size / (1024 * 1024)).toFixed(2)}{" "}
                                        MB
                                    </p>
                                </div>
                                {!uploading && !processing && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setFile(null);
                                        }}
                                        className="text-sm text-destructive hover:underline font-medium relative z-10"
                                    >
                                        Remove film
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
                                    <Upload className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium">
                                        Drag and drop video files to upload
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Your videos will be private until you
                                        publish them.
                                    </p>
                                </div>
                                <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors pointer-events-none">
                                    SELECT FILES
                                </button>
                            </div>
                        )}

                        {(uploading || processing) && (
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-background/80 backdrop-blur-sm rounded-b-2xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">
                                        {uploading
                                            ? "Uploading Chunks..."
                                            : "Processing..."}
                                    </span>
                                    <span className="text-sm font-medium">
                                        {uploading
                                            ? progress
                                            : processingProgress}
                                        %
                                    </span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-primary h-full transition-all duration-300"
                                        style={{
                                            width: `${uploading ? progress : processingProgress}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Title (required)
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={uploading || processing}
                                placeholder="Add a title that describes your video"
                                className="w-full px-4 py-3 bg-transparent border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Description
                            </label>
                            <textarea
                                rows={5}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={uploading || processing}
                                placeholder="Tell viewers about your video"
                                className="w-full px-4 py-3 bg-transparent border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-secondary/30 p-6 rounded-2xl border border-border">
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                            <AlertCircle className="w-4 h-4" />
                            Resumable Upload
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            Internet disconnected? Just select the same file
                            again to resume where you left off.
                        </p>
                        <ul className="text-sm space-y-3 text-muted-foreground">
                            <li>• Part size: 10MB</li>
                            <li>• Max file size: Unlimited</li>
                            <li>• Automatic retries enabled</li>
                        </ul>
                    </div>

                    <button
                        disabled={!file || !title || uploading || processing}
                        onClick={handleUpload}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        {uploading || processing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {uploading ? "UPLOADING..." : "PROCESSING..."}
                            </>
                        ) : (
                            "PUBLISH VIDEO"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
