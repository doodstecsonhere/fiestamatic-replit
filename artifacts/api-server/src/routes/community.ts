import { Router } from "express";
import { db, communityPostsTable, insertCommunityPostSchema } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import {
  GetCommunityPostsQueryParams,
  DeleteCommunityPostParams,
  CreateCommunityPostBody,
} from "@workspace/api-zod";

const router = Router();

// GET /community/posts
router.get("/community/posts", async (req, res) => {
  try {
    const query = GetCommunityPostsQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: "Invalid query parameters" });
      return;
    }

    let posts;
    if (query.data.type) {
      posts = await db
        .select()
        .from(communityPostsTable)
        .where(eq(communityPostsTable.post_type, query.data.type))
        .orderBy(desc(communityPostsTable.created_at));
    } else {
      posts = await db
        .select()
        .from(communityPostsTable)
        .orderBy(desc(communityPostsTable.created_at));
    }

    res.json(posts);
  } catch (err) {
    req.log.error({ err }, "Failed to get community posts");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /community/posts
router.post("/community/posts", async (req, res) => {
  try {
    const body = CreateCommunityPostBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const validInput = insertCommunityPostSchema.safeParse(body.data);
    if (!validInput.success) {
      res.status(400).json({ error: "Validation failed" });
      return;
    }

    const [created] = await db
      .insert(communityPostsTable)
      .values(validInput.data)
      .returning();

    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create community post");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /community/posts/:id
router.delete("/community/posts/:id", async (req, res) => {
  try {
    const params = DeleteCommunityPostParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid post ID" });
      return;
    }

    const [deleted] = await db
      .delete(communityPostsTable)
      .where(eq(communityPostsTable.id, params.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete community post");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /community/summary
router.get("/community/summary", async (req, res) => {
  try {
    const [stats] = await db
      .select({
        total_posts: sql<number>`count(*)::int`,
        carpool_posts: sql<number>`count(*) filter (where post_type = 'carpool')::int`,
        shared_table_posts: sql<number>`count(*) filter (where post_type = 'shared_table')::int`,
        general_posts: sql<number>`count(*) filter (where post_type = 'general')::int`,
        active_barangays: sql<number>`count(distinct barangay)::int`,
      })
      .from(communityPostsTable);

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to get community summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
