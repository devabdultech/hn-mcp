import { z } from "zod";

/**
 * Validate input against a Zod schema
 */
export function validateInput<T>(schema: z.ZodType<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      throw new Error(`Validation error: ${issues}`);
    }
    throw error;
  }
}
