#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { hnApi } from "./api/hn.js";
import { algoliaApi } from "./api/algolia.js";
import { formatStory } from "./models/story.js";
import { formatComment } from "./models/comment.js";
import { formatUser } from "./models/user.js";
import { validateInput } from "./utils/validation.js";
import { SearchParamsSchema } from "./schemas/search.js";
import {
  CommentRequestSchema,
  CommentsRequestSchema,
  CommentTreeRequestSchema,
  UserRequestSchema,
} from "./schemas/request.js";

// Create the MCP server
const server = new Server(
  {
    name: "hackernews-mcp-server",
    version: "1.1.10",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Set up the ListTools request handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search",
        description: "Search for stories and comments on Hacker News",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query" },
            type: {
              type: "string",
              enum: ["all", "story", "comment"],
              description: "The type of content to search for",
              default: "all",
            },
            page: {
              type: "number",
              description: "The page number",
              default: 0,
            },
            hitsPerPage: {
              type: "number",
              description: "The number of results per page",
              default: 20,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "getStory",
        description: "Get a single story by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The ID of the story" },
          },
          required: ["id"],
        },
      },
      {
        name: "getStoryWithComments",
        description: "Get a story with its comments",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The ID of the story" },
          },
          required: ["id"],
        },
      },
      {
        name: "getStories",
        description:
          "Get multiple stories by type (top, new, best, ask, show, job)",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["top", "new", "best", "ask", "show", "job"],
              description: "The type of stories to fetch",
            },
            limit: {
              type: "number",
              description: "The maximum number of stories to fetch",
              default: 30,
            },
          },
          required: ["type"],
        },
      },
      {
        name: "getComment",
        description: "Get a single comment by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The ID of the comment" },
          },
          required: ["id"],
        },
      },
      {
        name: "getComments",
        description: "Get comments for a story",
        inputSchema: {
          type: "object",
          properties: {
            storyId: { type: "number", description: "The ID of the story" },
            limit: {
              type: "number",
              description: "The maximum number of comments to fetch",
              default: 30,
            },
          },
          required: ["storyId"],
        },
      },
      {
        name: "getCommentTree",
        description: "Get a comment tree for a story",
        inputSchema: {
          type: "object",
          properties: {
            storyId: { type: "number", description: "The ID of the story" },
          },
          required: ["storyId"],
        },
      },
      {
        name: "getUser",
        description: "Get a user profile by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the user" },
          },
          required: ["id"],
        },
      },
      {
        name: "getUserSubmissions",
        description: "Get a user's submissions",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the user" },
          },
          required: ["id"],
        },
      },
    ],
  };
});

// Set up the CallTool request handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "search": {
      const validatedArgs = validateInput(SearchParamsSchema, args);
      const { query, type, page, hitsPerPage } = validatedArgs;
      const tags = type === "all" ? undefined : type;
      const results = await algoliaApi.search(query, {
        tags,
        page,
        hitsPerPage,
      });

      // Format the results to match the expected schema
      return {
        result: {
          hits: results.hits || [],
          page: results.page || 0,
          nbHits: results.nbHits || 0,
          nbPages: results.nbPages || 0,
          hitsPerPage: results.hitsPerPage || 20,
          processingTimeMS: results.processingTimeMS || 0,
        },
      };
    }

    case "getStory": {
      const { id } = args as { id: number };
      const item = await hnApi.getItem(id);
      if (!item || item.type !== "story") {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Story with ID ${id} not found`
        );
      }
      return { result: formatStory(item) };
    }

    case "getStoryWithComments": {
      const { id } = args as { id: number };
      const result = await algoliaApi.getStoryWithComments(id);
      if (!result) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Story with ID ${id} not found`
        );
      }
      return { result };
    }

    case "getStories": {
      const { type, limit = 30 } = args as {
        type: "top" | "new" | "best" | "ask" | "show" | "job";
        limit?: number;
      };
      let storyIds: number[] = [];

      switch (type) {
        case "top":
          storyIds = await hnApi.getTopStories(limit);
          break;
        case "new":
          storyIds = await hnApi.getNewStories(limit);
          break;
        case "best":
          storyIds = await hnApi.getBestStories(limit);
          break;
        case "ask":
          storyIds = await hnApi.getAskStories(limit);
          break;
        case "show":
          storyIds = await hnApi.getShowStories(limit);
          break;
        case "job":
          storyIds = await hnApi.getJobStories(limit);
          break;
      }

      const items = await hnApi.getItems(storyIds);
      return {
        result: items
          .filter((item) => item && item.type === "story")
          .map(formatStory),
      };
    }

    case "getComment": {
      const validatedArgs = validateInput(CommentRequestSchema, args);
      const { id } = validatedArgs;
      const item = await hnApi.getItem(id);
      if (!item || item.type !== "comment") {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Comment with ID ${id} not found`
        );
      }
      return { result: formatComment(item) };
    }

    case "getComments": {
      const validatedArgs = validateInput(CommentsRequestSchema, args);
      const { storyId, limit = 30 } = validatedArgs;
      const story = await hnApi.getItem(storyId);

      if (!story || !story.kids || story.kids.length === 0) {
        return { result: [] };
      }

      const commentIds = story.kids.slice(0, limit);
      const comments = await hnApi.getItems(commentIds);

      return {
        result: comments
          .filter((item) => item && item.type === "comment")
          .map(formatComment),
      };
    }

    case "getCommentTree": {
      const validatedArgs = validateInput(CommentTreeRequestSchema, args);
      const { storyId } = validatedArgs;

      // Use Algolia API to get the full comment tree in one request
      const result = await algoliaApi.getStoryWithComments(storyId);
      const data = await result.json();

      if (!data || !data.children) {
        return { result: [] };
      }

      return { result: data.children };
    }

    case "getUser": {
      const validatedArgs = validateInput(UserRequestSchema, args);
      const { id } = validatedArgs;

      // Try the official API first
      const user = await hnApi.getUser(id);

      if (!user) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `User with ID ${id} not found`
        );
      }

      return { result: formatUser(user) };
    }

    case "getUserSubmissions": {
      const validatedArgs = validateInput(UserRequestSchema, args);
      const { id } = validatedArgs;

      // Use Algolia API to search for user's submissions
      const results = await algoliaApi.search("", {
        tags: `author_${id}`,
        hitsPerPage: 50,
      });

      return {
        result: {
          hits: results.hits || [],
          nbHits: results.nbHits || 0,
        },
      };
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Tool '${name}' not found`);
  }
});

// Connect to the transport
async function runServer() {
  try {
    console.error("Initializing server...");
    const transport = new StdioServerTransport();

    // Connect transport
    await server.connect(transport);
    console.error("Server started and connected successfully");

    // Handle process signals
    process.on("SIGINT", () => {
      console.error("Received SIGINT, shutting down...");
      transport.close();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.error("Received SIGTERM, shutting down...");
      transport.close();
      process.exit(0);
    });

    console.error("Hacker News MCP Server running on stdio");
  } catch (error: unknown) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

runServer().catch((error: unknown) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
