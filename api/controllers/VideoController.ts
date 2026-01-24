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
    const fileName = `videos/${videoId}-${file.originalname.replace(
      /[^a-zA-Z0-9.-]/g,
      '%20'
    )}`;

    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: 'inline',
      CacheControl: 'public, max-age=31536000',
      Metadata: {
        'cross-origin-resource-policy': 'cross-origin',
      },
    });

    await r2Client.send(uploadCommand);

    // Generate R2 public URL
    const file_url = `https://${process.env.R2_PUBLIC_URL}/${fileName}`;

    // Save to database
    const [newVideo] = await db
      .insert(videos)
      .values({
        id: videoId,
        title,
        description,
        file_url,
        mimeType: file.mimetype,
        genreId: genreId || null,
      })
      .returning();

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: newVideo,
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
      return res.status(404).json({ error: 'Video not found in database' });
    }

    console.log('✅ Video metadata found:', video.title);
    console.log('🔗 Stored file URL:', video.file_url);

    // Extract the R2 key correctly
    let r2Key = '';

    r2Key = `${video.file_url}`; // Adjust based on your URL structure

    console.log('🔑 Using R2 Key:', r2Key);

    // Set CORS headers FIRST
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://streamz-api-39o0.onrender.com', // Backend
      'https://streamz-p03k.onrender.com', // Frontend
      'https://pub-7801d043ab3f4e069174ad35d8439a99.r2.dev', // R2 direct access
      req.headers.origin || '',
    ];

    const requestOrigin = req.headers.origin || '';
    const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : '*';

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, PUT, DELETE, POST,   HEAD, OPTIONS'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader(
      'Access-Control-Expose-Headers',
      'ETag, Content-Length, Content-Type, Content-Range, Content-Range, Accesnt-Control-Allow-Origin'
    );
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    try {
      // Check if file exists in R2
      const headCommand = new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
      });

      console.log('📡 Checking R2 for key:', r2Key);
      const headResponse = await r2Client.send(headCommand);
      console.log('✅ R2 Head response:', headResponse);

      if (!headResponse.ContentLength) {
        console.error('❌ No content length from R2 for key:', r2Key);
        return res
          .status(404)
          .json({ error: 'Video file not found in storage' });
      }

      const fileSize = headResponse.ContentLength;
      const mimeType =
        headResponse.ContentType || video.mimeType || 'video/mp4';

      console.log(`📏 File size: ${fileSize}, MIME type: ${mimeType}`);

      // Handle range requests for streaming
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
          'Content-Type': mimeType,
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
          if (typeof (Body as any).getReader === 'function') {
            // For Bun/Web Streams / Web ReadableStream
            const reader = (Body as any).getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          } else if (Body instanceof Blob) {
            // For Blob objects
            const arrayBuffer = await Body.arrayBuffer();
            res.write(Buffer.from(arrayBuffer));
            res.end();
          } else if (
            'pipe' in Body &&
            typeof (Body as any).pipe === 'function'
          ) {
            // For Node.js streams
            (Body as any).pipe(res);
          } else {
            // Fallback
            const chunks = [];
            for await (const chunk of Body) {
              chunks.push(chunk);
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

        const { Body, ContentLength, ContentType } = await r2Client.send(
          getCommand
        );

        res.writeHead(200, {
          'Content-Length': ContentLength || fileSize,
          'Content-Type': ContentType || mimeType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
        });

        if (Body) {
          // Pipe the stream
          if (Body instanceof Blob) {
            // For Blob objects
            const arrayBuffer = await Body.arrayBuffer();
            res.write(Buffer.from(arrayBuffer));
            res.end();
          } else if (
            'pipe' in Body &&
            typeof (Body as any).pipe === 'function'
          ) {
            (Body as any).pipe(res);
          } else if (typeof (Body as any).getReader === 'function') {
            // For Bun/Web Streams / Web ReadableStream
            const reader = (Body as any).getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          } else {
            const chunks = [];
            for await (const chunk of Body) {
              chunks.push(chunk);
            }
            res.write(Buffer.concat(chunks));
            res.end();
          }
        }
      }
    } catch (r2Error: any) {
      console.error('❌ R2 Error details:', {
        message: r2Error.message,
        name: r2Error.name,
        stack: r2Error.stack,
        key: r2Key,
        bucket: R2_BUCKET,
      });

      // Try direct redirect as fallback
      if (video.file_url) {
        console.log('🔄 Falling back to direct URL:', video.file_url);
        return res.redirect(video.file_url);
      }

      return res.status(500).json({
        error: 'Video streaming failed',
        details: r2Error.message,
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
