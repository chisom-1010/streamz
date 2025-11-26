import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { user_video_stamps } from "./columns.helpers";

export const genres = pgTable("genres", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(), // URL-friendly version: "action-movies"
  description: text("description"),
  ...user_video_stamps,
});
