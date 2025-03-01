import { z } from "zod";

export const CommentSchema = z.object({
  id: z.number(),
  text: z.string(),
  by: z.string(),
  time: z.number(),
  parent: z.number(),
  kids: z.array(z.number()).optional(),
  type: z.literal("comment"),
});

type CommentTree = {
  id: number;
  text: string;
  by: string;
  time: number;
  parent: number;
  children?: CommentTree[];
  type: "comment";
};

export const CommentTreeSchema: z.ZodType<CommentTree> = z.object({
  id: z.number(),
  text: z.string(),
  by: z.string(),
  time: z.number(),
  parent: z.number(),
  children: z.array(z.lazy(() => CommentTreeSchema)).optional(),
  type: z.literal("comment"),
});

export const CommentRequestSchema = z.object({
  id: z.number(),
});

export const CommentsRequestSchema = z.object({
  storyId: z.number(),
  limit: z.number().min(1).max(100).default(30),
});
