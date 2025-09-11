import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { user_video_stamps } from './columns.helpers';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true),
  ...user_video_stamps,
});
