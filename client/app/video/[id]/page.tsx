// src/app/video/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api';
import { Video } from '../../../shared/types/video.js';
import VideoList from '../../../components/VideoList';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import VideoJsPlayer from '../../../components/VideoPlayer';

export default function VideoPage() {
  const params = useParams();
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const videoId = params.id as string;
  const streamUrl = video?.file_url;

  const loadVideo = async () => {
    try {
      setLoading(true);
      console.log('📥 Loading video with ID:', videoId);

      // First, test if the backend is accessible
      const healthCheck = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/health`
      );
      console.log('🏥 Backend health:', healthCheck.status);

      // Then try to get the video
      const response = await apiClient.getVideo(videoId);
      console.log('✅ Video data:', response);

      if (response.video) {
        setVideo(response.video);

        // Test the streaming URL
        const streamTest = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/stream/${videoId}`,
          { method: 'HEAD' }
        );
        console.log('📹 Stream test:', streamTest.status);
      } else {
        setError('Video not found');
        toast.error('Video not found');
      }
    } catch (err: any) {
      console.error('❌ Error loading video:', err);

      // Try a direct fetch as fallback
      try {
        console.log('🔄 Trying direct fetch...');
        const directResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/stream/${videoId}`
        );
        const data = await directResponse.json();
        console.log('📡 Direct fetch result:', data);

        if (data.video) {
          setVideo(data.video);
        } else {
          setError(err.message || 'Failed to load video');
          toast.error('Failed to load video');
        }
      } catch (directError) {
        setError(err.message || 'Failed to load video');
        toast.error('Failed to load video');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      loadVideo();
    }
  }, [videoId, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    loadVideo();
  };

  const handleVideoEnd = () => {
    toast('Video Ended', {
      description: 'Check out more videos below!',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <header className='border-b bg-background/80 backdrop-blur-md'>
          <div className='max-w-7xl mx-auto px-4 py-4'>
            <div className='flex items-center gap-4'>
              <Button variant='ghost' size='sm' onClick={() => router.back()}>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back
              </Button>
              <div className='h-4 bg-muted animate-pulse rounded w-48'></div>
            </div>
          </div>
        </header>

        <main className='max-w-7xl mx-auto py-8 px-4'>
          <div className='space-y-6'>
            <div className='aspect-video bg-muted animate-pulse rounded-lg flex items-center justify-center'>
              <div className='text-center'>
                <RefreshCw className='h-8 w-8 animate-spin mx-auto mb-2' />
                <p className='text-sm text-muted-foreground'>
                  Loading video player...
                </p>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='h-8 bg-muted animate-pulse rounded w-3/4'></div>
              <div className='h-4 bg-muted animate-pulse rounded w-1/2'></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center space-y-4 max-w-md'>
          <h1 className='text-2xl font-bold text-destructive'>
            Video Not Found
          </h1>
          <p className='text-muted-foreground'>
            {error || 'The video you requested could not be found.'}
          </p>
          <div className='flex gap-4 justify-center flex-wrap'>
            <Button variant='outline' onClick={() => router.back()}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Go Back
            </Button>
            <Button onClick={handleRetry}>
              <RefreshCw className='h-4 w-4 mr-2' />
              Retry
            </Button>
            <Link href='/'>
              <Button>
                <Home className='h-4 w-4 mr-2' />
                Home
              </Button>
            </Link>
          </div>
          {videoId && (
            <div className='mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded text-left'>
              <p className='text-sm font-mono break-all'>Video ID: {videoId}</p>
              {video?.file_url && (
                <a
                  href={video.file_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-sm text-blue-600 hover:underline block mt-2 break-all'
                >
                  Direct Video Link
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <header className='border-b bg-background/80 backdrop-blur-md'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Button variant='ghost' size='sm' onClick={() => router.back()}>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back
              </Button>
              <h1 className='text-lg font-semibold truncate max-w-md'>
                {video.title}
              </h1>
            </div>

            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={handleRetry}>
                <RefreshCw className='h-4 w-4 mr-2' />
                Retry
              </Button>
              <Link href='/'>
                <Button variant='outline' size='sm'>
                  <Home className='h-4 w-4 mr-2' />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto py-8 px-4'>
        <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
          <div className='xl:col-span-2'>
            <VideoJsPlayer video={video} autoplay={true} />

            {/* Video Info */}
            <div className='mt-6'>
              <h1 className='text-2xl font-bold'>{video.title}</h1>
              {video.description && (
                <p className='text-gray-600 dark:text-gray-300 mt-2'>
                  {video.description}
                </p>
              )}
              {video.genre && (
                <div className='mt-4'>
                  <span className='inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full'>
                    {video.genre.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className='xl:col-span-1'>
            <h2 className='text-xl font-bold mb-6'>More Videos</h2>
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
