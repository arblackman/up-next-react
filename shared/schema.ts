import { pgTable, text, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  apiId: integer("api_id").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull().default("next"),
  priority: integer("priority").default(0).notNull(),
  status: text("status"),
  nextEpisodeDate: text("next_episode_date"),
  nextEpisodeNumber: integer("next_episode_number"),
  latestSeasonEpisodeCount: integer("latest_season_episode_count"),
  latestSeasonNumber: integer("latest_season_number"),
  lastRefreshedAt: timestamp("last_refreshed_at"),
  rating: integer("rating"),
});

export const insertShowSchema = createInsertSchema(shows).omit({ 
  id: true 
});

export type Show = typeof shows.$inferSelect;
export type InsertShow = z.infer<typeof insertShowSchema>;

export type CreateShowRequest = Omit<InsertShow, 'userId'>;
export type UpdateShowRequest = Partial<Omit<InsertShow, 'userId'>>;

export type SearchResult = {
  apiId: number;
  title: string;
  imageUrl?: string;
  summary?: string;
  year?: string;
};
