import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communityPostsTable = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  author_name: text("author_name").notNull(),
  post_type: text("post_type", { enum: ["carpool", "shared_table", "general"] }).notNull(),
  barangay: text("barangay").notNull(),
  message: text("message").notNull(),
  contact_info: text("contact_info"),
  seats_available: integer("seats_available"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPostsTable)
  .omit({ id: true, created_at: true })
  .extend({
    author_name: z.string().min(1).max(100),
    message: z.string().min(1).max(500),
    contact_info: z.string().max(200).optional(),
    seats_available: z.number().int().min(1).max(20).optional(),
  });

export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPostsTable.$inferSelect;
