import { z } from "zod";

export const StorySchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string().optional(),
  text: z.string().optional(),
  by: z.string(),
  score: z.number(),
  time: z.number(),
  descendants: z.number(),
  kids: z.array(z.number()).optional(),
  type: z.literal("story"),
});

export const StoryListSchema = z.array(StorySchema);

export const StoryRequestSchema = z.object({
  id: z.number().int().positive(),
});

export const StoriesRequestSchema = z.object({
  type: z.enum(["top", "new", "best", "ask", "show", "job"]),
  limit: z.number().int().min(1).max(100).default(30),
});
