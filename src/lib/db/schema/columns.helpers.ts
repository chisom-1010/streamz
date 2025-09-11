import { timestamp } from 'drizzle-orm/pg-core';

export const user_video_stamps = {
  updated_at: timestamp('updated_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}

export const genre_view_stamps = {
  created_at: timestamp('created_at').defaultNow().notNull(),
}
