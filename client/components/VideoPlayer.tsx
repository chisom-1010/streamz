// components/VideoPlayer.tsx - FIXED VERSION
'use client';

import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';
import 'videojs-hls-quality-selector';
import { Video } from '../shared/types/video.js';

interface VideoJsPlayerProps {
  video: Video;
  autoplay?: boolean;
}

export default function VideoJsPlayer({
  video,
  autoplay = false,
}: VideoJsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if element exists and is in DOM
    if (!videoRef.current) {
      console.log('❌ videoRef.current is null');
      return;
    }

    console.log(
      '🎬 Checking if element is in DOM:',
      document.body.contains(videoRef.current),
    );
    console.log('🎬 Parent element:', videoRef.current.parentElement);

    // Don't initialize if already initialized
    if (isInitialized) {
      console.log('⚠️ Player already initialized, skipping...');
      return;
    }

    console.log('🎬 Initializing video player for:', video.id);

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const streamingUrl = `${API_BASE_URL}/api/stream/${video.id}`;
    const mimeType = video.mimeType || 'video/mp4';

    console.log('🔗 Streaming URL:', streamingUrl);
    console.log('🎞️ MIME Type:', mimeType);

    // Ensure video element has required attributes
    if (videoRef.current) {
      videoRef.current.setAttribute('data-setup', '{}');
      videoRef.current.classList.add(
        'video-js',
        'vjs-default-skin',
        'vjs-big-play-centered',
      );
    }

    try {
      // Initialize Video.js player
      const player = videojs(
        videoRef.current, // This should be a video element
        {
          controls: true,
          autoplay,
          preload: 'auto',
          fluid: true,
          liveui: true,
          sources: [
            {
              src: streamingUrl,
              type: mimeType,
            },
          ],
          html5: {
            vhs: {
              overrideNative: true,
            },
            nativeAudioTracks: false,
            nativeVideoTracks: false,
          },
        },
      );

      playerRef.current = player;

      // onPlayerReady logic (run after initialization to avoid using `this` in a functional component)
      console.log('✅ Video.js player ready');
      setIsInitialized(true);

      // Add quality selector for HLS (cast to any for plugin methods)
      const anyPlayer = player as any;
      if (anyPlayer.tech_ && anyPlayer.tech_.vhs) {
        console.log('🔧 Adding quality selector');
        if (typeof anyPlayer.qualityLevels === 'function') {
          anyPlayer.qualityLevels();
        }
        if (typeof anyPlayer.hlsQualitySelector === 'function') {
          anyPlayer.hlsQualitySelector();
        }
      }

      // Set up event listeners
      player.on('error', (e: any) => {
        console.error('❌ Video.js error event fired');
        const error = player.error();
        console.error('Player error:', error);

        if (error) {
          setError(`Video error (${error.code}): ${error.message}`);

          // Try direct URL as fallback
          if (video.file_url) {
            console.log('🔄 Trying direct URL as fallback:', video.file_url);
            player.src({
              src: video.file_url,
              type: mimeType,
            });
          }
        }
      });

      player.on('loadstart', () => {
        console.log('📥 Load start event');
        setError(null);
      });

      player.on('loadedmetadata', () => {
        console.log('✅ Metadata loaded');
        console.log('Duration:', player.duration());
        console.log(
          'Video dimensions:',
          player.videoWidth(),
          'x',
          player.videoHeight(),
        );
      });

      player.on('loadeddata', () => console.log('✅ Data loaded'));
      player.on('canplay', () => console.log('▶️ Can play'));
      player.on('canplaythrough', () => console.log('🎯 Can play through'));

      // Debug: Log player state
      setTimeout(() => {
        console.log('🔍 Player state after init:');
        console.log('- Current source:', player.currentSrc());
        console.log('- Current time:', player.currentTime());
        console.log('- Paused:', player.paused());
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to initialize Video.js:', error);
      setError('Failed to initialize video player');
    }

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up video player');
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      setIsInitialized(false);
    };
  }, [video.id]); // Only re-run when video.id changes

  // Create a unique ID for the video element
  const videoElementId = `video-js-player-${video.id}`;

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
      <div data-vjs-player className='h-full w-full'>
        <video
          id={videoElementId}
          ref={videoRef}
          className='video-js vjs-default-skin vjs-big-play-centered vjs-fluid h-full w-full'
          controls
          preload='auto'
          playsInline
          webkit-playsinline='true'
          data-setup='{}'
        >
          <source
            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/stream/${video.id}`}
            type={video.mimeType || 'video/mp4'}
          />
          <p className='vjs-no-js'>
            To view this video please enable JavaScript, and consider upgrading
            to a web browser that{' '}
            <a href='https://videojs.com/html5-video-support/' target='_blank'>
              supports HTML5 video
            </a>
          </p>
        </video>
      </div>
    </div>
  );
}
