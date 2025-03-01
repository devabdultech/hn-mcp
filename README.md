# Hacker News MCP Server

Official Hacker News MCP Server - Adds powerful Hacker News integration to Cursor, Claude, and any other LLM clients. Access stories, comments, user profiles, and search functionality through the Model Context Protocol.

## Features

- Search stories and comments using Algolia's HN Search API
- Get stories by type (top, new, best, ask, show, job)
- Get individual stories with comments
- Get comment trees and user discussions
- Get user profiles and submissions
- Real-time access to Hacker News data

## Installation

### Running with npx

The quickest way to get started:

```bash
npx @devabdultech/hn-mcp-server
```

### Manual Installation

```bash
npm install -g @devabdultech/hn-mcp-server
hn-mcp-server
```

### Running on Cursor

Add this to your `~/.cursor/config.json`:

```json
{
  "mcpServers": {
    "hackernews": {
      "command": "npx",
      "args": ["-y", "@devabdultech/hn-mcp-server"]
    }
  }
}
```

### Running on Windsurf

Add this to your `~/.windsurf/config.json`:

```json
{
  "mcpServers": {
    "hackernews": {
      "command": "npx",
      "args": ["-y", "@devabdultech/hn-mcp-server"]
    }
  }
}
```

### Running on Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hackernews": {
      "command": "npx",
      "args": ["-y", "@devabdultech/hn-mcp-server"]
    }
  }
}
```

## Available Tools

### 1. Search Tool (search)
Search for stories and comments on Hacker News using Algolia's search API.
```json
{
  "name": "search",
  "arguments": {
    "query": "artificial intelligence",
    "type": "story",
    "page": 0,
    "hitsPerPage": 20
  }
}
```

### 2. Get Stories Tool (getStories)
Get multiple stories by type (top, new, best, ask, show, job).
```json
{
  "name": "getStories",
  "arguments": {
    "type": "top",
    "limit": 30
  }
}
```

### 3. Get Story with Comments (getStoryWithComments)
Get a story along with its comment thread.
```json
{
  "name": "getStoryWithComments",
  "arguments": {
    "id": 123456
  }
}
```

### 4. Get Comment Tree (getCommentTree)
Get the full comment tree for a story.
```json
{
  "name": "getCommentTree",
  "arguments": {
    "storyId": 123456
  }
}
```

### 5. Get User Profile (getUser)
Get a user's profile information.
```json
{
  "name": "getUser",
  "arguments": {
    "id": "username"
  }
}
```

### 6. Get User Submissions (getUserSubmissions)
Get a user's submissions (stories and comments).
```json
{
  "name": "getUserSubmissions",
  "arguments": {
    "id": "username"
  }
}
```

## Error Handling

The server implements standard MCP error codes and provides detailed error messages for:
- Invalid parameters
- Resource not found
- API rate limiting
- Network errors

## Development

### Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT

## About

This MCP server is built and maintained by [devabdultech](https://github.com/devabdultech). It uses the official Hacker News API and Algolia Search API to provide comprehensive access to Hacker News data through the Model Context Protocol.
