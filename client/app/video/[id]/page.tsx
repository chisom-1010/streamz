// src/app/video/[id]/page.tsx - Individual video page
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "../../../lib/api";
import { Video } from "../../../shared/types/video.js";
import VideoPlayer from "../../../components/VideoPlayer";
import VideoList from "../../../components/VideoList";
import { Button } from "../../../components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function VideoPage() {
  const params = useParams();
  const router = useRouter();

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoId = params.id as string;

  useEffect(() => {
    if (videoId) {
      loadVideo();
    }
  }, [videoId]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getVideo(videoId);
      setVideo(response.video);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load video";
      setError(errorMessage);

      toast("Error Loading Video", {
        description: errorMessage,
        // variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoEnd = () => {
    toast("Video Ended", {
      description: "Check out more videos below!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-4 bg-muted animate-pulse rounded w-48"></div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4">
          <div className="space-y-6">
            <div className="aspect-video bg-muted animate-pulse rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-8 bg-muted animate-pulse rounded w-3/4"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Video Not Found
          </h1>
          <p className="text-muted-foreground">
            {error || "The video you requested could not be found."}
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Link href="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-lg font-semibold truncate">{video.title}</h1>
            </div>

            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="xl:col-span-2">
            <VideoPlayer
              video={video}
              autoplay={true}
              onVideoEnd={handleVideoEnd}
            />
          </div>

          {/* Related Videos */}
          <div className="xl:col-span-1">
            <h2 className="text-xl font-bold mb-6">More Videos</h2>
            <VideoList
              limit={6}
              genre={video.genre?.slug}
              onVideoClick={(clickedVideo) => {
                if (clickedVideo.id !== video.id) {
                  router.push(`/video/${clickedVideo.id}`);
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
