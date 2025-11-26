import { Request, Response } from "express";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "../config/r2";
import { db } from "../config/database";
import { videos, genres } from "../shared/db/schema/index";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";

// Multer setup for file uploads
export const upload = multer({ storage: multer.memoryStorage() });

// Upload video
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    const { title, description, genreId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    // Generate unique filename
    const videoId = uuidv4();
    const fileName = `videos/${videoId}-${file.originalname}`;

    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
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
      message: "Video uploaded successfully",
      video: newVideo,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload video" });
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
    console.error("Get videos error:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
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
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({ video });
  } catch (error) {
    console.error("Get video error:", error);
    res.status(500).json({ error: "Failed to fetch video" });
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
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({
      message: "Video updated successfully",
      video: updatedVideo,
    });
  } catch (error) {
    console.error("Update video error:", error);
    res.status(500).json({ error: "Failed to update video" });
  }
};

// Delete video
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get video to get file URL for R2 deletion
    const [video] = await db.select().from(videos).where(eq(videos.id, id));

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Delete from R2
    const fileName = video.file_url.split("/").pop();
    if (fileName) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: `videos/${fileName}`,
      });
      await r2Client.send(deleteCommand);
    }

    // Delete from database
    await db.delete(videos).where(eq(videos.id, id));

    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Delete video error:", error);
    res.status(500).json({ error: "Failed to delete video" });
  }
};
