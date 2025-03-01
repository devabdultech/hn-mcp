import { z } from "zod";

export const SearchParamsSchema = z.object({
  query: z.string(),
  type: z.enum(["all", "story", "comment"]).default("all"),
  page: z.number().min(0).optional(),
  hitsPerPage: z.number().min(1).max(100).optional(),
});

export const SearchResultSchema = z.object({
  hits: z.array(z.any()),
  page: z.number(),
  nbHits: z.number(),
  nbPages: z.number(),
  hitsPerPage: z.number(),
  processingTimeMS: z.number(),
});
