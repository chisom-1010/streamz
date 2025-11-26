// src/frontend/components/VideoPlayer.tsx - Video player component
"use client";

import React, { useRef, useEffect, useState } from "react";
import { Video } from "../shared/types/video";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Clock,
  Calendar,
} from "lucide-react";
import gsap from "gsap";

interface VideoPlayerProps {
  video: Video;
  autoplay?: boolean;
  onVideoEnd?: () => void;
  className?: string;
}

export default function VideoPlayer({
  video,
  autoplay = false,
  onVideoEnd,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onVideoEnd?.();
    };

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("ended", handleEnded);

    if (autoplay) {
      videoElement
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }

    return () => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("ended", handleEnded);
    };
  }, [video.id, autoplay, onVideoEnd]);

  const togglePlay = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error toggling video playback:", error);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;

    const newMutedState = !isMuted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
  };

  const toggleFullscreen = async () => {
    if (!videoRef.current) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await videoRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div ref={containerRef} className={`space-y-4 ${className}`}>
      {/* Video Player */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              poster={video.thumbnail_url}
              preload="metadata"
              onClick={togglePlay}
            >
              <source src={video.file_url} type={video.mimeType} />
              Your browser does not support the video tag.
            </video>

            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-3 text-white">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 fill-current" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>

                <div className="flex-1 flex items-center gap-2 text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <div className="flex-1 bg-white/30 rounded-full h-1">
                    <div
                      className="bg-white rounded-full h-full transition-all duration-100"
                      style={{
                        width: `${
                          duration ? (currentTime / duration) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span>{formatTime(duration)}</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Information */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold leading-tight">
                  {video.title}
                </h1>
                {video.genre && (
                  <Badge variant="secondary">{video.genre.name}</Badge>
                )}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(video.createdAt)}
                </div>
                {video.duration && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-4 w-4" />
                    {formatTime(video.duration)}
                  </div>
                )}
              </div>
            </div>

            {video.description && (
              <div className="pt-2 border-t">
                <p className="text-muted-foreground leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
