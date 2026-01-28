import { Request, Response } from 'express';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET } from '../config/r2';
import { db } from '../config/database';
import { videos, genres } from '../shared/db/schema/index';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

// Multer setup for file uploads
export const upload = multer({ storage: multer.memoryStorage() });

// Upload video
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    const { title, description, genreId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Generate unique filename
    const videoId = uuidv4();
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '%20');
    const r2Key = `videos/${videoId}-${safeFilename}`; // This is the R2 key

    console.log('📤 Uploading to R2 with key:', r2Key);

    // Upload to R2 with PUBLIC permissions
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: 'inline',
      CacheControl: 'public, max-age=31536000',
      ACL: 'public-read', // Make object publicly readable
      Metadata: {
        'cross-origin-resource-policy': 'cross-origin',
      },
    });

    await r2Client.send(uploadCommand);

    // 🔥 Generate the CORRECT public URL
    // Format: https://pub-{accountId}.r2.dev/{r2Key}
    const file_url = `https://${process.env.R2_PUBLIC_URL}/${r2Key}`;

    console.log('🔗 Generated public URL:', file_url);

    // Save to database
    const [newVideo] = await db
      .insert(videos)
      .values({
        id: videoId,
        title,
        description,
        file_url, // This should be the full public URL
        mimeType: file.mimetype,
        genreId: genreId || null,
        // We don't store r2_key since we don't have the column
      })
      .returning();

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: newVideo,
      note: 'Video will be streamed through /api/stream/:id endpoint',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
};

// Get all videos
export const getVideos = async (req: Request, res: Response) => {
  try {
    const allVideos = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        file_url: videos.file_url,
        thumbnail_url: videos.thumbnail_url,
        duration: videos.duration,
        mimeType: videos.mimeType,
        genre: {
          id: genres.id,
          name: genres.name,
          slug: genres.slug,
        },
      })
      .from(videos)
      .leftJoin(genres, eq(videos.genreId, genres.id));

    res.json({ videos: allVideos });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
};

// Get single video
export const getVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [video] = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        file_url: videos.file_url,
        thumbnail_url: videos.thumbnail_url,
        duration: videos.duration,
        mimeType: videos.mimeType,
        genre: {
          id: genres.id,
          name: genres.name,
          slug: genres.slug,
        },
      })
      .from(videos)
      .leftJoin(genres, eq(videos.genreId, genres.id))
      .where(eq(videos.id, id));

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ video });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
};

// Stream video with PROPER CORS headers
export const streamVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const range = req.headers.range;

    console.log('🎬 Streaming request for video ID:', id);

    // Get video from database
    const [video] = await db.select().from(videos).where(eq(videos.id, id));

    if (!video) {
      console.error('❌ Video not found in database:', id);
      return res.status(404).json({ error: 'Video not found' });
    }

    console.log('✅ Video metadata found:', video.title);
    console.log('🔗 Stored file_url:', video.file_url);

    let r2Key = '';

    if (video.file_url) {
      // More robust extraction
      const url = new URL(video.file_url);
      // Remove the leading slash from pathname
      r2Key = url.pathname.startsWith('/')
        ? url.pathname.substring(1)
        : url.pathname;

      // Decode URL-encoded characters
      r2Key = decodeURIComponent(r2Key);

      console.log('🔑 Extracted R2 key:', r2Key);
    }

    // If extraction fails, try to construct from known pattern
    if (!r2Key && video.file_url && video.file_url.includes('r2.dev/videos/')) {
      const parts = video.file_url.split('r2.dev/videos/');
      if (parts.length > 1) {
        r2Key = 'videos/' + decodeURIComponent(parts[1]);
        console.log('🔑 Constructed R2 key:', r2Key);
      }
    }

    if (!r2Key) {
      console.error('❌ Could not extract R2 key from URL:', video.file_url);
      return res.status(500).json({
        error: 'Invalid video URL format',
        file_url: video.file_url,
      });
    }

    console.log('🔑 Final R2 key to use:', r2Key);

    // ========== SET CORS HEADERS ==========
    const allowedOrigins = [
      'http://localhost:3000',
      'https://streamz-p03k.onrender.com',
      'https://streamz-api-39o0.onrender.com',
      'https://pub-7801d043ab3f4e069174ad35d8439a99.r2.dev', // R2 direct access
      req.headers.origin || '',
    ];

    const requestOrigin = req.headers.origin || '';
    const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : '*';

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Range, Content-Type, Authorization',
    );
    res.setHeader(
      'Access-Control-Expose-Headers',
      'Content-Length, Content-Range, Content-Type, Accept-Ranges',
    );
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // ========== STREAM FROM R2 ==========
    try {
      // Get video metadata from R2
      const headCommand = new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
      });

      console.log('📡 Checking R2 for key:', r2Key);
      const headResponse = await r2Client.send(headCommand);
      console.log('✅ R2 Head response:', {
        contentLength: headResponse.ContentLength,
        contentType: headResponse.ContentType,
        lastModified: headResponse.LastModified,
      });

      if (!headResponse.ContentLength) {
        console.error('❌ No content length from R2');
        return res
          .status(404)
          .json({ error: 'Video file not found in R2 storage' });
      }

      const fileSize = headResponse.ContentLength;
      const contentType =
        headResponse.ContentType || video.mimeType || 'video/mp4';

      console.log(`📏 File size: ${fileSize}, Content-Type: ${contentType}`);

      // Handle range requests (for streaming)
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
          res.setHeader('Content-Range', `bytes */${fileSize}`);
          return res.status(416).end();
        }

        const chunkSize = end - start + 1;

        // Set partial content headers
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        });

        console.log(`📦 Streaming bytes ${start}-${end} of ${fileSize}`);

        // Get the chunk from R2
        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: r2Key,
          Range: `bytes=${start}-${end}`,
        });

        const { Body } = await r2Client.send(getCommand);

        if (Body) {
          // Pipe the stream to response
          if ((Body as any).pipe) {
            (Body as any).pipe(res);
          } else if (typeof (Body as any).getReader === 'function') {
            // For Bun/Web Streams
            const reader = (Body as any).getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          } else {
            // Fallback
            const chunks: Buffer[] = [];
            for await (const chunk of Body as AsyncIterable<
              Uint8Array | Buffer
            >) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            res.write(Buffer.concat(chunks));
            res.end();
          }
        }
      } else {
        // Full file request
        console.log('📥 Full video request');

        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: r2Key,
        });

        const {
          Body,
          ContentLength,
          ContentType: r2ContentType,
        } = await r2Client.send(getCommand);

        const finalContentType = r2ContentType || contentType;
        const finalContentLength = ContentLength || fileSize;

        res.writeHead(200, {
          'Content-Length': finalContentLength,
          'Content-Type': finalContentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
        });

        if (Body) {
          // Pipe the stream
          if ((Body as any).pipe) {
            (Body as any).pipe(res);
          } else if (typeof (Body as any).getReader === 'function') {
            const reader = (Body as any).getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          } else {
            const chunks: Buffer[] = [];
            for await (const chunk of Body as AsyncIterable<
              Uint8Array | Buffer
            >) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            res.write(Buffer.concat(chunks));
            res.end();
          }
        }
      }
    } catch (r2Error: any) {
      console.error('❌ R2 streaming error:', {
        message: r2Error.message,
        name: r2Error.name,
        key: r2Key,
        bucket: R2_BUCKET,
      });

      // 🚫 DO NOT redirect to R2 URL - it will cause CORS errors!
      // Instead, return a proper error
      return res.status(500).json({
        error: 'Video streaming failed',
        details: r2Error.message,
        note: 'Check if the R2 key exists and has proper permissions',
      });
    }
  } catch (error: any) {
    console.error('❌ Stream video error:', error);
    res.status(500).json({
      error: 'Failed to stream video',
      details: error.message,
    });
  }
};
// Update video
export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, genreId } = req.body;

    const [updatedVideo] = await db
      .update(videos)
      .set({
        title,
        description,
        genreId,
      })
      .where(eq(videos.id, id))
      .returning();

    if (!updatedVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({
      message: 'Video updated successfully',
      video: updatedVideo,
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
};

// Delete video
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get video to get file URL for R2 deletion
    const [video] = await db.select().from(videos).where(eq(videos.id, id));

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Delete from R2
    const fileName = video.file_url.split('/').pop();
    if (fileName) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: `videos/${fileName}`,
      });
      await r2Client.send(deleteCommand);
    }

    // Delete from database
    await db.delete(videos).where(eq(videos.id, id));

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
};
