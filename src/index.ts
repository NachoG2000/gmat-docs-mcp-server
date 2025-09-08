import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import OpenAI from 'openai';
import * as path from 'path';
import { SearchEngine } from './utils/search.js';

// Initialize dependencies
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openaiClient = new OpenAI({ apiKey });
const cacheDir = process.env.CACHE_DIR || path.join(process.cwd(), 'data');
const searchEngine = new SearchEngine(cacheDir);

// Create MCP server with proper initialization
const server = new Server(
  {
    name: "gmat-docs-mcp-server",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "searchDocs",
        description: "Semantic search over GMAT documentation. Returns relevant sections with full content and sources.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query - can be a question, topic, or keyword related to GMAT"
            },
            topK: {
              type: "number",
              description: "Maximum number of results to return (default: 10)",
              minimum: 1,
              maximum: 50,
              default: 10
            },
            minScore: {
              type: "number",
              description: "Minimum similarity score threshold (0-1, default: 0.1)",
              minimum: 0,
              maximum: 1,
              default: 0.1
            }
          },
          required: ["query"]
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "searchDocs") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { query, topK = 10, minScore = 0.1 } = request.params.arguments as any;

  try {
    // Generate embedding for the query
    const embeddingResponse = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      encoding_format: 'float'
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Perform search
    const results = await searchEngine.search(queryEmbedding, topK, minScore);

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No relevant documentation found for query: "${query}"`
          }
        ]
      };
    }

    // Format results
    let response = `Found ${results.length} relevant section${results.length > 1 ? 's' : ''} for: "${query}"\n\n`;
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const { chunk, score } = result;
      
      response += `## Result ${i + 1} (Score: ${score.toFixed(3)})\n`;
      response += `**Page**: ${chunk.pageName}\n`;
      response += `**Source**: ${chunk.href}\n`;
      response += `**Content**:\n${chunk.fullContent}\n\n`;
      response += '---\n\n';
    }

    return {
      content: [
        {
          type: "text",
          text: response.trim()
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: "text",
          text: `Error searching documentation: ${errorMessage}`
        }
      ]
    };
  }
});

// Start server
async function main() {
  try {
    // Load cache first
    console.error('Loading GMAT documentation cache...');
    await searchEngine.loadCache();
    const stats = searchEngine.getStats();
    console.error(`Cache loaded: ${stats.totalChunks} chunks available`);

    // Create and connect transport
    const transport = new StdioServerTransport();
    console.error('Starting GMAT Docs MCP Server...');
    
    await server.connect(transport);
    console.error('GMAT Docs MCP Server is running');
  } catch (error) {
    console.error('Failed to start GMAT Docs MCP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down GMAT Docs MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Shutting down GMAT Docs MCP Server...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});