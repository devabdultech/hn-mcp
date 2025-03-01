#!/usr/bin/env node

import { startServer } from "./server.js";

// Start the MCP server
startServer().catch((error) => {
  // Use process.stderr instead of console.error to avoid interfering with stdout JSON communication
  process.stderr.write(`Failed to start server: ${error.message}\n`);
  process.exit(1);
});
