//VideList.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '../lib/api';
import { Video } from '../shared/types/video';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Play, Calendar, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRouter } from 'next/navigation';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface VideoListProps {
  onVideoClick?: (video: Video) => void;
  genre?: string;
  limit?: number;
  className?: string;
}

export default function VideoList({
  onVideoClick,
  genre,
  limit = 50,
  className,
}: VideoListProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadVideos();
  }, [genre, limit]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getVideos({ genre, limit });
      setVideos(response.videos);

      // Animate video cards on load
      setTimeout(() => {
        if (gridRef.current) {
          const cards = gridRef.current.querySelectorAll('.video-card');
          gsap.fromTo(
            cards,
            { opacity: 0, y: 50, scale: 0.9 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: 'power2.out',
            }
          );
        }
      }, 100);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load videos';
      setError(errorMessage);

      toast('Error Loading Videos', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    if (onVideoClick) {
      onVideoClick(video);
    } else {
      // Navigate to video page using Next.js router
      router.push(`/video/${video.id}`);

      // Show a toast notification
      toast(`Opening: ${video.title}`, {
        duration: 2000,
      });
    }
  };

  const formatDuration = (duration?: number): string => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 ${className}`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className='overflow-hidden'>
            <CardContent className='p-0'>
              <Skeleton className='aspect-video w-full' />
              <div className='p-4 space-y-2'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-3 w-1/2' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center h-64 space-y-4'>
        <div className='text-center'>
          <h3 className='text-lg font-semibold text-destructive mb-2'>
            Error Loading Videos
          </h3>
          <p className='text-muted-foreground'>{error}</p>
        </div>
        <Button onClick={loadVideos} variant='outline'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Retry
        </Button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4'>
          <Play className='h-8 w-8 text-muted-foreground' />
        </div>
        <h3 className='text-lg font-semibold mb-2'>No videos available</h3>
        <p className='text-muted-foreground'>
          {genre
            ? `No videos found in the "${genre}" category.`
            : 'Upload some videos to get started!'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 ${className}`}
    >
      {videos.map((video) => (
        <Card
          key={video.id}
          className='video-card overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group'
          onClick={() => handleVideoClick(video)}
        >
          <CardContent className='p-0'>
            {/* Video Thumbnail/Preview */}
            <div className='relative aspect-video bg-black overflow-hidden'>
              <video
                className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                poster={video.thumbnail_url}
                preload='metadata'
                muted
                onMouseEnter={(e) => {
                  // Subtle hover animation
                  gsap.to(e.currentTarget, { scale: 1.02, duration: 0.3 });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.3 });
                }}
              >
                <source src={video.file_url} type={video.mimeType} />
              </video>

              {/* Play Button Overlay */}
              <div className='absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
                <div className='bg-white/90 rounded-full p-3 transform group-hover:scale-110 transition-transform duration-200'>
                  <Play className='h-6 w-6 text-black fill-current' />
                </div>
              </div>

              {/* Duration Badge */}
              {video.duration && (
                <Badge
                  variant='secondary'
                  className='absolute bottom-2 right-2 bg-black/70 text-white'
                >
                  <Clock className='h-3 w-3 mr-1' />
                  {formatDuration(video.duration)}
                </Badge>
              )}
            </div>

            {/* Video Info */}
            <div className='p-4 space-y-3'>
              <h3 className='font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors leading-tight'>
                {video.title}
              </h3>

              {video.description && (
                <p className='text-muted-foreground text-sm line-clamp-2 leading-relaxed'>
                  {video.description}
                </p>
              )}

              <div className='flex items-center justify-between pt-2'>
                <div className='flex items-center gap-2'>
                  {video.genre && (
                    <Badge variant='outline' className='text-xs'>
                      {video.genre.name}
                    </Badge>
                  )}
                </div>

                <div className='flex items-center text-xs text-muted-foreground'>
                  <Calendar className='h-3 w-3 mr-1' />
                  {formatDate(video.createdAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
