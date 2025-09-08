## GMAT Docs MCP Server

Semantic search over the GMAT documentation via the Model Context Protocol (MCP). This server scrapes, parses, embeds, and caches GMAT docs so any MCP-compatible client (e.g., Cursor, Claude Desktop, custom apps) can query them with the `searchDocs` tool.

### Features
- **searchDocs tool**: semantic search with OpenAI embeddings
- **Local cache**: embeddings stored in `data/embeddings.json`
- **Deterministic pipeline**: scrape → parse/chunk → embed → cache

## Requirements
- Node.js 18+ (ESM, OpenAI SDK v5)
- pnpm (project uses `pnpm@10` per `package.json`)
- An OpenAI API key with access to `text-embedding-3-small`

## Quick Start
1) Clone the repo
```bash
git clone https://github.com/your-org/gmat-docs-mcp-server.git
cd gmat-docs-mcp-server
```

2) Install dependencies
```bash
pnpm install
```

3) Configure environment
Create a `.env.local` (used at runtime) and/or `.env` (also read by setup) file at the repo root:
```bash
echo "OPENAI_API_KEY=your_api_key_here" > .env.local
```
Optional variables you can add (defaults shown):
- `CACHE_DIR` (default: `./data`)
- `BASE_URL` (default: `https://documentation.help/gmat/`)

4) Build the project
```bash
pnpm build
```

5) Generate the local cache (scrape, parse/chunk, embed)
```bash
pnpm run setup
```
This produces `data/embeddings.json` (or `${CACHE_DIR}/embeddings.json`).

6) Start the MCP server
```bash
pnpm start
```
The server runs over stdio and exposes the `searchDocs` tool to your MCP client.

## Scripts
- **pnpm build**: compile TypeScript to `dist/`
- **pnpm start**: run server from `dist/index.js` (loads `.env.local`)
- **pnpm dev**: run server in watch mode with `ts-node`
- **pnpm run setup**: build cache from live docs (requires OpenAI API key)
- **pnpm run setup:test**: build a smaller test cache using `pages-test.json`

Pass `--force` to `setup` to rebuild the cache from scratch:
```bash
pnpm run setup -- --force
```

## Environment Variables
- **OPENAI_API_KEY** (required): used for embeddings
- **CACHE_DIR** (optional): directory for `embeddings.json` (default: `./data`)
- **BASE_URL** (optional): docs base URL (default: `https://documentation.help/gmat/`)
- **NODE_ENV** (optional): set to `test` to use `pages-test.json` during setup
- **MCP_PORT** (optional): for wrappers/adapters that expose this stdio server via TCP/SSE. This server itself communicates over stdio and does not bind to a port; some clients or adapters may read `MCP_PORT` to decide which port to listen on.

Files read for env values:
- Setup reads both `.env` and `.env.local`
- Runtime reads `.env.local` (via `pnpm start`) or your shell env

## Using with MCP Clients
This server communicates via stdio. Point your MCP client to execute the server in your project directory. Two common approaches:

### Option A: Use the start script
```bash
pnpm start
```
Your MCP client should spawn this command in the repo root (ensures `.env.local` is picked up).

### Option B: Use the wrapper
There is a convenience wrapper that ensures env loading, then starts the compiled server:
```bash
node start-mcp.js
```

Note: If you run the server behind an adapter that serves MCP over SSE/TCP, you can set `MCP_PORT` to guide that adapter. The server code here still talks over stdio.

### Tool: searchDocs
Inputs:
- `query` (string, required)
- `topK` (number, default 10, 1–50)
- `minScore` (number, default 0.1, 0–1)

Output: formatted text with page name, source URL, similarity score, and extracted content.

## Data and Cache
- Cache file: `data/embeddings.json` (or `${CACHE_DIR}/embeddings.json`)
- To rebuild: `pnpm run setup -- --force`
- To use a smaller test set: `pnpm run setup:test`

## Customizing Pages
The list of pages to scrape is defined in:
- `pages.json` (full set)
- `pages-test.json` (smaller set for tests)

You can edit these files to change the crawl scope. The parser attempts to extract meaningful sections by headings and convert them to Markdown for embedding.

## Troubleshooting
- **Error: OPENAI_API_KEY environment variable is required**
  - Create `.env.local` (and optionally `.env`) with `OPENAI_API_KEY`
- **Cache not found at data/embeddings.json. Run setup first.**
  - Run `pnpm build && pnpm run setup` to generate the cache
- **Network timeouts while scraping**
  - The scraper retries with exponential backoff; rerun `setup` or adjust your network
- **MCP client can’t see tools**
  - Ensure the server is started from the project directory and connected via stdio
  - Confirm `pnpm start` logs show the server is running and the cache is loaded

## Project Structure
```
src/
  index.ts        # MCP server entry (stdio)
  setup.ts        # Setup pipeline: scrape → parse/chunk → embed → cache
  tools/          # MCP tool definitions and handlers
  utils/          # scraper, parser, embedder, cache, search
data/             # Default cache directory (embeddings.json)
pages.json        # Full list of pages to scrape
pages-test.json   # Smaller list for testing
dist/             # Compiled JavaScript (after pnpm build)
start-mcp.js      # Wrapper to load env and run the server
```

## License
ISC


