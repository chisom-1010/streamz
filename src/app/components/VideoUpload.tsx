"use client";

import React, { useState, useRef, useEffect } from "react";
import { apiClient } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Label } from "@/ui/label";
import { Progress } from "@/ui/progress";
import { Upload, CheckCircle, FileVideo } from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";

interface VideoUploadProps {
  onUploadComplete?: (video: any) => void;
  className?: string;
}

export default function VideoUpload({
  onUploadComplete,
  className,
}: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial card animation
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      toast("File Selected", {
        description: `${selectedFile.name} (${(
          selectedFile.size /
          1024 /
          1024
        ).toFixed(2)} MB)`,
      });
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setProgress(0);
    setUploadSuccess(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title.trim()) {
      toast("Missing Information", {
        description: "Please select a file and enter a title",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast("Invalid File Type", {
        description: "Please select a video file",
      });
      return;
    }

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title.trim());
    if (description.trim()) {
      formData.append("description", description.trim());
    }

    setUploading(true);
    setUploadSuccess(false);

    // Animate progress bar appearance
    if (progressRef.current) {
      gsap.fromTo(
        progressRef.current,
        { opacity: 0, height: 0 },
        { opacity: 1, height: "auto", duration: 0.3 }
      );
    }

    try {
      // Simulate progress (since we can't track real upload progress easily)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 800);

      const result = await apiClient.uploadVideo(formData);

      clearInterval(progressInterval);
      setProgress(100);

      // Success animation
      setTimeout(() => {
        setUploadSuccess(true);
        if (successRef.current) {
          gsap.fromTo(
            successRef.current,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
          );
        }
      }, 300);

      // Reset form after animation
      setTimeout(() => {
        resetForm();

        // Hide progress bar
        if (progressRef.current) {
          gsap.to(progressRef.current, {
            opacity: 0,
            height: 0,
            duration: 0.3,
          });
        }

        onUploadComplete?.(result.video);

        toast("Upload Successful!", {
          description: "Your video has been uploaded successfully.",
        });
      }, 2500);
    } catch (error: any) {
      console.error("Upload error:", error);

      toast("Upload Failed", {
        description: error.message || "An error occurred during upload",
      });

      // Reset progress on error
      setProgress(0);
      if (progressRef.current) {
        gsap.to(progressRef.current, { opacity: 0, height: 0, duration: 0.3 });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card ref={cardRef} className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Video
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="video-file">Video File</Label>
            <Input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="cursor-pointer"
            />
            {file && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <FileVideo className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              disabled={uploading}
              required
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter video description (optional)"
              disabled={uploading}
              className="min-h-[80px]"
            />
          </div>

          {/* Upload Progress */}
          <div ref={progressRef} className="opacity-0 space-y-2">
            {uploading && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </>
            )}

            {uploadSuccess && (
              <div
                ref={successRef}
                className="flex items-center justify-center text-green-600 py-2"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Upload Complete!
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={uploading || !file || !title.trim()}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
