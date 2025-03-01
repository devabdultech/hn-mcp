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

export async function startServer() {
  // Create the MCP server
  const server = new Server(
    {
      name: "hacker-news-mcp",
      version: "1.0.0",
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
          parameters: {
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
          parameters: {
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
          parameters: {
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
          parameters: {
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
          parameters: {
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
          parameters: {
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
          parameters: {
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
          parameters: {
            type: "object",
            properties: {
              id: { type: "string", description: "The ID of the user" },
            },
            required: ["id"],
          },
        },
        {
          name: "getUserSubmissions",
          description: "Get a user's submissions (stories and comments)",
          parameters: {
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
        return {
          hits: results.hits,
          page: results.page,
          nbHits: results.nbHits,
          nbPages: results.nbPages,
          hitsPerPage: results.hitsPerPage,
          processingTimeMS: results.processingTimeMS,
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
        return formatStory(item);
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
        return result;
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
        return items
          .filter((item) => item && item.type === "story")
          .map(formatStory);
      }

      case "getComment": {
        const { id } = args as { id: number };
        const item = await hnApi.getItem(id);
        if (!item || item.type !== "comment") {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Comment with ID ${id} not found`
          );
        }
        return formatComment(item);
      }

      case "getComments": {
        const { storyId, limit = 30 } = args as {
          storyId: number;
          limit?: number;
        };
        const story = await hnApi.getItem(storyId);

        if (!story || !story.kids || story.kids.length === 0) {
          return [];
        }

        const commentIds = story.kids.slice(0, limit);
        const comments = await hnApi.getItems(commentIds);

        return comments
          .filter((item) => item && item.type === "comment")
          .map(formatComment);
      }

      case "getCommentTree": {
        const { storyId } = args as { storyId: number };

        // Use Algolia API to get the full comment tree in one request
        const result = await fetch(
          `https://hn.algolia.com/api/v1/items/${storyId}`
        );
        const data = await result.json();

        if (!data || !data.children) {
          return [];
        }

        return data.children;
      }

      case "getUser": {
        const { id } = args as { id: string };

        // Try the official API first
        const user = await hnApi.getUser(id);

        if (!user) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `User with ID ${id} not found`
          );
        }

        return formatUser(user);
      }

      case "getUserSubmissions": {
        const { id } = args as { id: string };

        // Use Algolia API to search for user's submissions
        const results = await algoliaApi.search("", {
          tags: `author_${id}`,
          hitsPerPage: 50,
        });

        return {
          hits: results.hits,
          nbHits: results.nbHits,
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool '${name}' not found`
        );
    }
  });

  // Connect to the transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log("Hacker News MCP server started");
}