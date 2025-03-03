import { z } from "zod";

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
  id: z.string().min(1),
});
