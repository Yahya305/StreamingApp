import { createFileRoute } from "@tanstack/react-router";
import { Upload, X, Film, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import axios from "axios";

export const Route = createFileRoute("/upload")({
    component: UploadPage,
});

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

    const handleUpload = async () => {
        if (!file || !title) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("video", file);
        formData.append("title", title);
        formData.append("description", description);

        try {
            const response = await axios.post(
                "http://localhost:3000/videos/upload",
                formData,
                {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) /
                                (progressEvent.total || 1)
                        );
                        setProgress(percentCompleted);
                    },
                }
            );

            const videoId = response.data.id;
            setUploading(false);
            setProcessing(true);

            // Start SSE for processing progress
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
                    alert("Video is ready!");
                }
            };

            eventSource.onerror = () => {
                eventSource.close();
                setProcessing(false);
                alert(
                    "Lost connection to processing server, but it's still working in background."
                );
            };
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload video. Please try again.");
            setUploading(false);
        }
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
                            disabled={uploading}
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
                                {!uploading && (
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
                                            ? "Uploading..."
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
                            Upload Tips
                        </h3>
                        <ul className="text-sm space-y-3 text-muted-foreground">
                            <li>• Supported formats: .mp4, .mov, .avi</li>
                            <li>• Max file size: 2GB</li>
                            <li>• Recommended ratio: 16:9</li>
                            <li>• Use keywords in title for better search</li>
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
