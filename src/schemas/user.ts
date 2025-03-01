import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  created: z.number(),
  karma: z.number(),
  about: z.string().optional(),
  submitted: z.array(z.number()).optional(),
});

export const UserRequestSchema = z.object({
  id: z.string(),
});
