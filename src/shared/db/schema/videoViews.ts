import { pgTable, uuid, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { videos } from './videos';
import { user_video_stamps } from './columns.helpers';

export const videoViews = pgTable('video_views', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Relationships
  videoId: uuid('video_id').references(() => videos.id).notNull(),
  userId: uuid('user_id').references(() => users.id), // nullable for anonymous views

  // Analytics data
  watchTime: integer('watch_time').default(0), // seconds watched

  ...user_video_stamps,
});
