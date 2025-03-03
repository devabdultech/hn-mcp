import { z } from "zod";

// Story schemas
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

// Comment schemas
export const CommentSchema = z.object({
  id: z.number(),
  text: z.string(),
  by: z.string(),
  time: z.number(),
  parent: z.number(),
  kids: z.array(z.number()).optional(),
  type: z.literal("comment"),
});

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  karma: z.number(),
  created: z.number(),
  about: z.string().optional(),
  submitted: z.array(z.number()).optional(),
});

// Request schemas
export const SearchParamsSchema = z.object({
  query: z.string(),
  type: z.enum(["all", "story", "comment"]).default("all"),
  page: z.number().int().min(0).default(0),
  hitsPerPage: z.number().int().min(1).max(100).default(20),
});

export const StoryRequestSchema = z.object({
  id: z.number().int().positive(),
});

export const CommentRequestSchema = z.object({
  id: z.number().int().positive(),
});

export const CommentsRequestSchema = z.object({
  storyId: z.number().int().positive(),
  limit: z.number().int().min(1).max(100).default(30),
});

export const CommentTreeRequestSchema = z.object({
  storyId: z.number().int().positive(),
});

export const UserRequestSchema = z.object({
  id: z.string(),
});

export const StoriesRequestSchema = z.object({
  type: z.enum(["top", "new", "best", "ask", "show", "job"]),
  limit: z.number().int().min(1).max(100).default(30),
});
