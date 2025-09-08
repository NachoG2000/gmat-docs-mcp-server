# GMAT Documentation MCP Server

A Model Context Protocol (MCP) server that provides semantic search capabilities over GMAT (General Mission Analysis Tool) documentation. This server allows MCP-compatible clients (like Claude Desktop, Cursor, etc.) to search through GMAT study materials using natural language queries and AI-powered embeddings.

## Features

- **Semantic Search**: Uses OpenAI embeddings for intelligent document search
- **GMAT-Focused**: Specialized content from official GMAT resources
- **MCP Compatible**: Works with any MCP client
- **Multiple Transport Options**: Supports both local stdio and remote SSE connections
- **Pre-processed Content**: Includes pre-built embeddings for faster searches

## Prerequisites

- **Node.js**: Version 18 or higher
- **Package Manager**: pnpm (recommended) or npm
- **OpenAI API Key**: Required for embeddings and search functionality

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/gmat-docs-mcp-server.git
cd gmat-docs-mcp-server
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build the Project

```bash
pnpm build
```

### 4. Configure Environment

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
BASE_URL=https://documentation.help/gmat/
MCP_PORT=8000
```

### 5. Setup Documentation Cache

```bash
pnpm setup
```

This will scrape GMAT documentation and generate embeddings.

## Usage

### Local Development (Stdio Transport)

For local development and testing, use the stdio transport:

```bash
# Start the MCP server in stdio mode
pnpm start
```

Or for development with auto-restart:

```bash
pnpm dev
```

### MCP Client Configuration

#### Cursor (Local)

Add to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gmat-docs": {
      "command": "node",
      "args": ["/absolute/path/to/gmat-docs-mcp-server/start-mcp.js"],
      "cwd": "/absolute/path/to/gmat-docs-mcp-server",
      "env": {}
    }
  }
}
```

#### Claude Desktop (Local)

Add to your MCP configuration file (usually `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "gmat-docs": {
      "command": "node",
      "args": ["/absolute/path/to/gmat-docs-mcp-server/start-mcp.js"],
      "cwd": "/absolute/path/to/gmat-docs-mcp-server"
    }
  }
}
```

### Remote Deployment (SSE Transport)

For remote access, deploy the server and connect via HTTP/SSE:

#### 1. Start SSE Server

```bash
# Build and start the HTTP/SSE server
pnpm build
node dist/http.js
```

The server will start on port 3000 by default.

#### 2. Configure MCP Client (Remote)

Add to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gmat-docs-remote": {
      "url": "https://your-deployed-server.com/sse",
      "headers": {}
    }
  }
}
```

## Deployment

### Recommended Platforms

The server can be deployed to any platform that supports long-running Node.js processes:

- **Railway**: `railway up` (recommended for ease of use)
- **Fly.io**: `fly deploy`
- **Render**: Connect GitHub repo
- **Heroku**: `git push heroku main`
- **VPS/Cloud Instance**: Manual deployment with PM2

### Environment Variables for Production

```env
OPENAI_API_KEY=your_openai_api_key_here
CACHE_DIR=./data
PORT=3000
NODE_ENV=production
```

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/http.js"]
```

## Available Tools

### searchDocs

Performs semantic search over GMAT documentation.

**Parameters:**
- `query` (string, required): Search query (question, topic, or keyword)
- `topK` (number, optional): Maximum results to return (default: 10, max: 50)
- `minScore` (number, optional): Minimum similarity score threshold (default: 0.1, range: 0-1)

**Example Usage:**
```
Search for "probability questions" or "how to solve word problems"
```

## Project Structure

```
gmat-docs-mcp-server/
├── src/
│   ├── index.ts          # Main MCP server (stdio transport)
│   ├── http.ts           # HTTP/SSE server for remote access
│   ├── setup.ts          # Documentation scraper and embedding generator
│   ├── tools/
│   │   └── gmatDocs.ts   # MCP tool definitions
│   └── utils/
│       ├── cache.ts      # Cache management
│       ├── embedder.ts   # OpenAI embedding utilities
│       ├── pages.ts      # Page configuration
│       ├── parser.ts     # HTML content parsing
│       ├── scraper.ts    # Web scraping utilities
│       └── search.ts     # Search engine implementation
├── data/
│   └── embeddings.json   # Pre-processed embeddings cache
├── dist/                 # Compiled JavaScript
├── start-mcp.js          # Startup script for stdio mode
└── package.json
```

## Development

### Setup Development Environment

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode with auto-restart
pnpm dev
```

### Testing the Setup Process

```bash
# Test setup with sample data
pnpm setup:test
```

### Adding New Documentation Sources

1. Edit `src/utils/pages.ts` to add new URLs
2. Run `pnpm setup` to regenerate embeddings
3. Rebuild: `pnpm build`

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings | - | Yes |
| `CACHE_DIR` | Directory for embeddings cache | `./data` | No |
| `PORT` | Port for HTTP/SSE server | `3000` | No |

### MCP Configuration Files

#### Cursor (`~/.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "gmat-docs": {
      "command": "node",
      "args": ["/path/to/gmat-docs-mcp-server/start-mcp.js"],
      "cwd": "/path/to/gmat-docs-mcp-server",
      "env": {}
    }
  }
}
```

#### Claude Desktop (macOS)
Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

## Troubleshooting

### Common Issues

1. **"Cache not found" error**
   ```bash
   pnpm setup  # Regenerate the embeddings cache
   ```

2. **OpenAI API errors**
   - Verify `OPENAI_API_KEY` is set correctly
   - Check API quota and billing status

3. **Connection refused**
   - For local: Ensure server is running with `pnpm start`
   - For remote: Verify deployment URL and network connectivity

4. **No search results**
   - Check that setup completed successfully
   - Verify embeddings cache exists in `data/embeddings.json`

### Debug Mode

Run with verbose logging:

```bash
DEBUG=* pnpm start
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Run `pnpm build` to ensure everything compiles
5. Submit a pull request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for API changes

## License

ISC License - see LICENSE file for details

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with:
   - Your environment (OS, Node version, MCP client)
   - Steps to reproduce
   - Error messages/logs
   - Expected vs actual behavior

## Acknowledgments

- Built using the [Model Context Protocol](https://modelcontextprotocol.io/)
- Uses OpenAI embeddings for semantic search
- Documentation sourced from official GMAT resources
