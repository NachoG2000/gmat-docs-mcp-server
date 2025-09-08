#!/usr/bin/env node

// Simple wrapper script to load environment variables and start MCP server
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.local') });

// Ensure critical environment variables are set
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}

// Set default values for optional env vars
process.env.CACHE_DIR = process.env.CACHE_DIR || join(__dirname, 'data');

// Import and run the MCP server directly
import('./dist/index.js').catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});