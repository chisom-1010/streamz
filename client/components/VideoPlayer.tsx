// components/VideoPlayer.tsx - DEBUG VERSION
'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Video } from '../shared/types/video.js';
import { apiClient } from '../lib/api';

interface VideoJsPlayerProps {
  video: Video;
  autoplay?: boolean;
}

export default function VideoJsPlayer({
  video,
  autoplay = false,
}: VideoJsPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    console.log('🎬 Initializing video player for:', video.id);
    console.log('📹 Video file URL:', video.file_url);
    console.log('🎞️ MIME type:', video.mimeType);

    // Test both URLs
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const directUrl = video.file_url;
    console.log('🔗 Direct video URL:', directUrl);
    const VID_URL = process.env.R2_PUBLIC_URL;
    const streamingUrl = `${API_BASE_URL}/api/stream/${video.id}`;
    console.log('🔗 Streaming endpoint:', streamingUrl);

    // Initialize Video.js player
    playerRef.current = videojs(
      videoRef.current,
      {
        controls: true,
        autoplay,
        preload: 'metadata',
        fluid: true,
        sources: [
          {
            src: streamingUrl,
            type: video.mimeType || 'video/mp4',
          },
        ],
        html5: {
          nativeControlsForTouch: true,
          vhs: {
            overrideNative: true,
          },
        },
      },
      () => {
        console.log('✅ Video.js player ready');
      }
    );

    // Error handling
    playerRef.current.on('error', (e: any) => {
      console.error('❌ Video.js error:', e);
      console.error('Error details:', playerRef.current?.error());

      setError(
        `Video error: ${playerRef.current?.error()?.message || 'Unknown error'}`
      );

      // Try direct URL as fallback
      if (video.file_url) {
        console.log('🔄 Trying direct URL as fallback:', video.file_url);
        playerRef.current.src({
          src: video.file_url,
          type: video.mimeType || 'video/mp4',
        });
      }
    });

    // Log events for debugging
    playerRef.current.on('loadstart', () => console.log('📥 Load start'));
    playerRef.current.on('loadedmetadata', () =>
      console.log('✅ Metadata loaded')
    );
    playerRef.current.on('loadeddata', () => console.log('✅ Data loaded'));
    playerRef.current.on('canplay', () => console.log('▶️ Can play'));
    playerRef.current.on('canplaythrough', () =>
      console.log('🎯 Can play through')
    );

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [video.id, video.mimeType, video.file_url, autoplay]);

  if (error) {
    return (
      <div className='aspect-video bg-black rounded-lg flex items-center justify-center'>
        <div className='text-center p-8'>
          <div className='text-red-500 text-xl font-bold mb-2'>Video Error</div>
          <p className='text-gray-400 mb-4'>{error}</p>
          <div className='space-y-2'>
            <a
              href={video.file_url}
              target='_blank'
              rel='noopener noreferrer'
              className='block text-blue-400 hover:underline'
            >
              Try direct video link
            </a>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white'
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='relative aspect-video bg-black rounded-lg overflow-hidden'>
      <div data-vjs-player>
        <div
          ref={videoRef}
          className='video-js vjs-big-play-centered vjs-fluid'
        />
      </div>
    </div>
  );
}
