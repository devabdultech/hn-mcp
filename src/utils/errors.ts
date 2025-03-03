import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

export class NotFoundError extends McpError {
  constructor(resource: string, id: string | number) {
    super(ErrorCode.InvalidParams, `${resource} with ID ${id} not found`);
  }
}

export class ValidationError extends McpError {
  constructor(message: string) {
    super(ErrorCode.InvalidParams, `Validation error: ${message}`);
  }
}

export class ApiError extends McpError {
  constructor(api: string, message: string) {
    super(ErrorCode.InternalError, `${api} API error: ${message}`);
  }
}

export function handleApiError(error: unknown, api: string): never {
  if (error instanceof Error) {
    throw new ApiError(api, error.message);
  }
  throw new ApiError(api, "Unknown error occurred");
}
