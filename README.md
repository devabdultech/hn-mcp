# Hacker News MCP Server

[![smithery badge](https://smithery.ai/badge/@devabdultech/hn-mcp)](https://smithery.ai/server/@devabdultech/hn-mcp)
Official Hacker News MCP Server - Adds powerful Hacker News integration to Cursor, Claude, and any other LLM clients. Access stories, comments, user profiles, and search functionality through the Model Context Protocol.

<a href="https://glama.ai/mcp/servers/73uji99mwg">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/73uji99mwg/badge" alt="Hacker News Server MCP server" />
</a>

## Features

- Search stories and comments using Algolia's HN Search API
- Get stories by type (top, new, best, ask, show, job)
- Get individual stories with comments
- Get comment trees and user discussions
- Get user profiles and submissions
- Real-time access to Hacker News data

## Set Up

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

### Installing via Smithery

To install Hacker News MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@devabdultech/hn-mcp):

```bash
npx -y @smithery/cli install @devabdultech/hn-mcp --client claude
```

## Tools

1. `search`
   * Search for stories and comments on Hacker News using Algolia's search API
   * Inputs:
         * `query` (string): Search query
         * `type` (optional string): Filter by type ('story' or 'comment')
         * `page` (optional number): Page number for pagination
         * `hitsPerPage` (optional number): Results per page (max 100)
   * Returns: Search results with stories and comments

2. `getStories`
   * Get multiple stories by type (top, new, best, ask, show, job)
   * Inputs:
         * `type` (string): Type of stories to fetch ('top', 'new', 'best', 'ask', 'show', 'job')
         * `limit` (optional number): Number of stories to fetch (max 100)
   * Returns: Array of story objects

3. `getStoryWithComments`
   * Get a story along with its comment thread
   * Inputs:
         * `id` (number): Story ID
   * Returns: Story details with nested comments

4. `getCommentTree`
   * Get the full comment tree for a story
   * Inputs:
         * `storyId` (number): ID of the story
   * Returns: Hierarchical comment tree structure

5. `getUser`
   * Get a user's profile information
   * Inputs:
         * `id` (string): Username
   * Returns: User profile details including karma, created date, and about text

6. `getUserSubmissions`
   * Get a user's submissions (stories and comments)
   * Inputs:
         * `id` (string): Username
   * Returns: Array of user's submitted stories and comments


### Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This MCP server is licensed under the MIT License. See the LICENSE file for details.

## About

This MCP server is built and maintained by [devabdultech](https://github.com/devabdultech). It uses the official Hacker News API and Algolia Search API to provide comprehensive access to Hacker News data through the Model Context Protocol.
