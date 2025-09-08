import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SearchEngine, SearchResult } from '../utils/search.js';
import OpenAI from 'openai';

export interface GmatDocsToolsConfig {
  searchEngine: SearchEngine;
  openaiClient: OpenAI;
}

export const GMAT_DOCS_TOOLS: Tool[] = [
  {
    name: 'searchDocs',
    description: 'Semantic search over GMAT documentation. Returns relevant sections with full content and sources.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query - can be a question, topic, or keyword related to GMAT'
        },
        topK: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
          minimum: 1,
          maximum: 50,
          default: 10
        },
        minScore: {
          type: 'number',
          description: 'Minimum similarity score threshold (0-1, default: 0.1)',
          minimum: 0,
          maximum: 1,
          default: 0.1
        }
      },
      required: ['query']
    }
  }
];

export async function handleSearchDocs(
  args: { query: string; topK?: number; minScore?: number },
  config: GmatDocsToolsConfig
): Promise<string> {
  const { query, topK = 10, minScore = 0.1 } = args;
  const { searchEngine, openaiClient } = config;

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
      return `No relevant documentation found for query: "${query}"`;
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

    return response.trim();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `Error searching documentation: ${errorMessage}`;
  }
}

export async function handleGmatDocsTool(
  toolName: string,
  args: any,
  config: GmatDocsToolsConfig
): Promise<string> {
  switch (toolName) {
    case 'searchDocs':
      return handleSearchDocs(args, config);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}