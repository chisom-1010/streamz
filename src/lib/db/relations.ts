import { relations } from 'drizzle-orm';
import { users } from './schema/users';
import { genres } from './schema/genres';
import { videos } from './schema/videos';
import { videoViews } from './schema/videoViews';

export const usersRelations = relations(users, ({ many }) => ({
  views: many(videoViews),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  genre: one(genres, {
    fields: [videos.genreId],
    references: [genres.id],
  }),
  views: many(videoViews),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  videos: many(videos),
}));

export const videoViewsRelations = relations(videoViews, ({ one }) => ({
  video: one(videos, {
    fields: [videoViews.videoId],
    references: [videos.id],
  }),
  user: one(users, {
    fields: [videoViews.userId],
    references: [users.id],
  }),
}));
