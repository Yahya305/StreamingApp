import { createFileRoute } from "@tanstack/react-router";
import { Upload, X, Film, AlertCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/upload")({
    component: UploadPage,
});

function UploadPage() {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);

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
            setFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Upload Video</h1>
                <button className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors">
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
                        {file ? (
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                    <Film className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {(file.size / (1024 * 1024)).toFixed(2)}{" "}
                                        MB
                                    </p>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="text-sm text-destructive hover:underline font-medium"
                                >
                                    Remove film
                                </button>
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
                                <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors">
                                    SELECT FILES
                                </button>
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
                        disabled={!file}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                    >
                        PUBLISH VIDEO
                    </button>
                </div>
            </div>
        </div>
    );
}
