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
import {
  SearchParamsSchema,
  CommentRequestSchema,
  CommentsRequestSchema,
  CommentTreeRequestSchema,
  UserRequestSchema,
} from "./schemas/index.js";

// Create the MCP server
const server = new Server(
  {
    name: "hackernews-mcp-server",
    version: "1.2.1",
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

      const hits = results.hits || [];
      const text = hits
        .map(
          (hit: any, index: number) =>
            `${index + 1}. ${hit.title}\n` +
            `   ID: ${hit.objectID}\n` +
            `   URL: ${hit.url || "(text post)"}\n` +
            `   Points: ${hit.points} | Author: ${hit.author} | Comments: ${hit.num_comments}\n\n`
        )
        .join("");

      return {
        content: [{ type: "text", text: text.trim() }],
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
      const story = formatStory(item);
      const text =
        `Story ID: ${story.id}\n` +
        `Title: ${story.title}\n` +
        `URL: ${story.url || "(text post)"}\n` +
        `Points: ${story.score} | Author: ${story.by} | Comments: ${story.descendants}\n` +
        (story.text ? `\nContent:\n${story.text}\n` : "");

      return {
        content: [{ type: "text", text: text.trim() }],
      };
    }

    case "getStoryWithComments": {
      const { id } = args as { id: number };
      try {
        const data = await algoliaApi.getStoryWithComments(id);
        if (!data || !data.title) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Story with ID ${id} not found`
          );
        }

        const formatCommentTree = (comment: any, depth = 0): string => {
          const indent = "  ".repeat(depth);
          let text = `${indent}Comment by ${comment.author} (ID: ${comment.id}):\n`;
          text += `${indent}${comment.text}\n`;
          text += `${indent}Posted: ${comment.created_at}\n\n`;

          if (comment.children) {
            text += comment.children
              .map((child: any) => formatCommentTree(child, depth + 1))
              .join("");
          }
          return text;
        };

        const text =
          `Story ID: ${data.id}\n` +
          `Title: ${data.title}\n` +
          `URL: ${data.url || "(text post)"}\n` +
          `Points: ${data.points} | Author: ${data.author}\n\n` +
          `Comments:\n` +
          (data.children || [])
            .map((comment: any) => formatCommentTree(comment))
            .join("");

        return {
          content: [{ type: "text", text: text.trim() }],
        };
      } catch (err) {
        const error = err as Error;
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to fetch story: ${error.message}`
        );
      }
    }

    case "getStories": {
      const { type, limit = 30 } = args as {
        type: "top" | "new" | "best" | "ask" | "show" | "job";
        limit?: number;
      };
      try {
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
        const stories = items
          .filter((item) => item && item.type === "story")
          .map(formatStory);

        if (stories.length === 0) {
          return {
            content: [{ type: "text", text: "No stories found." }],
          };
        }

        const text = stories
          .map(
            (story, index) =>
              `${index + 1}. ${story.title}\n` +
              `   ID: ${story.id}\n` +
              `   URL: ${story.url || "(text post)"}\n` +
              `   Points: ${story.score} | Author: ${story.by} | Comments: ${story.descendants}\n\n`
          )
          .join("");

        return {
          content: [{ type: "text", text: text.trim() }],
        };
      } catch (err) {
        const error = err as Error;
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to fetch stories: ${error.message}`
        );
      }
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
      const comment = formatComment(item);
      const text =
        `Comment ID: ${comment.id}\n` +
        `Comment by ${comment.by}:\n` +
        `${comment.text}\n` +
        `Parent ID: ${comment.parent}\n`;

      return {
        content: [{ type: "text", text: text.trim() }],
      };
    }

    case "getComments": {
      const validatedArgs = validateInput(CommentsRequestSchema, args);
      const { storyId, limit = 30 } = validatedArgs;
      try {
        const story = await hnApi.getItem(storyId);

        if (!story || !story.kids || story.kids.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No comments found for story ID: ${storyId}`,
              },
            ],
          };
        }

        const commentIds = story.kids.slice(0, limit);
        const comments = await hnApi.getItems(commentIds);
        const formattedComments = comments
          .filter((item) => item && item.type === "comment")
          .map(formatComment);

        if (formattedComments.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No comments found for story ID: ${storyId}`,
              },
            ],
          };
        }

        const text =
          `Comments for Story ID: ${storyId}\n\n` +
          formattedComments
            .map(
              (comment, index) =>
                `${index + 1}. Comment by ${comment.by} (ID: ${
                  comment.id
                }):\n` + `   ${comment.text}\n\n`
            )
            .join("");

        return {
          content: [{ type: "text", text: text.trim() }],
        };
      } catch (err) {
        const error = err as Error;
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to fetch comments: ${error.message}`
        );
      }
    }

    case "getCommentTree": {
      const validatedArgs = validateInput(CommentTreeRequestSchema, args);
      const { storyId } = validatedArgs;
      try {
        const data = await algoliaApi.getStoryWithComments(storyId);

        if (!data || !data.children || data.children.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No comments found for story ID: ${storyId}`,
              },
            ],
          };
        }

        const formatCommentTree = (comment: any, depth = 0): string => {
          const indent = "  ".repeat(depth);
          let text = `${indent}Comment by ${comment.author} (ID: ${comment.id}):\n`;
          text += `${indent}${comment.text}\n\n`;

          if (comment.children) {
            text += comment.children
              .map((child: any) => formatCommentTree(child, depth + 1))
              .join("");
          }
          return text;
        };

        const text =
          `Comment tree for Story ID: ${storyId}\n\n` +
          data.children
            .map((comment: any) => formatCommentTree(comment))
            .join("");

        return {
          content: [{ type: "text", text: text.trim() }],
        };
      } catch (err) {
        const error = err as Error;
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to fetch comment tree: ${error.message}`
        );
      }
    }

    case "getUser": {
      const validatedArgs = validateInput(UserRequestSchema, args);
      const { id } = validatedArgs;

      const user = await hnApi.getUser(id);

      if (!user) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `User with ID ${id} not found`
        );
      }

      const formattedUser = formatUser(user);
      const text =
        `User Profile:\n` +
        `Username: ${formattedUser.id}\n` +
        `Karma: ${formattedUser.karma}\n` +
        `Created: ${new Date(formattedUser.created * 1000).toISOString()}\n` +
        (formattedUser.about ? `\nAbout:\n${formattedUser.about}\n` : "");

      return {
        content: [{ type: "text", text: text.trim() }],
      };
    }

    case "getUserSubmissions": {
      const validatedArgs = validateInput(UserRequestSchema, args);
      const { id } = validatedArgs;

      const results = await algoliaApi.search("", {
        tags: `author_${id}`,
        hitsPerPage: 50,
      });

      const hits = results.hits || [];
      const text =
        `Submissions by ${id}:\n\n` +
        hits
          .map(
            (hit: any, index: number) =>
              `${index + 1}. ${hit.title || hit.comment_text}\n` +
              `   ID: ${hit.objectID}\n` +
              `   Points: ${hit.points || 0} | Posted: ${hit.created_at}\n\n`
          )
          .join("");

      return {
        content: [{ type: "text", text: text.trim() }],
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
