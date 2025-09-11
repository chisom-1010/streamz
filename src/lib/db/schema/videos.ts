import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { genres } from './genres';
import { user_video_stamps } from './columns.helpers';

export const videos = pgTable('videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),

  // File URLs (Cloudflare R2)
  fileUrl: text('file_url').notNull(), // R2 video file URL
  thumbnailUrl: text('thumbnail_url'), // R2 thumbnail URL

  // Video metadata
  duration: integer('duration'), // in seconds
  mimeType: text('mime_type').default('video/mp4'),

  // Relationships
  genreId: uuid('genre_id').references(() => genres.id),

  // Timestamps
  ...user_video_stamps,
});
