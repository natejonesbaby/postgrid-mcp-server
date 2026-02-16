# PostGrid MCP Server

## Project Structure

```
src/
  index.ts                     # Entry point — registers all tools, starts stdio transport
  server/postgrid-mcp-server.ts  # Singleton McpServer instance
  clients/
    postgrid-client-base.ts    # Abstract HTTP client (auth, timeouts, mode detection)
    postgrid-print-client.ts   # Print & Mail API client
    postgrid-verify-client.ts  # Address Verification API client
  helpers/
    register-tool.ts           # RegisterTool() wrapper
    format-error.ts            # Error → string formatting
    format-money.ts            # String-based dollar↔cents conversion
    cost-estimator.ts          # Offline rate table and cost estimation
    idempotency.ts             # Deterministic SHA-256 idempotency keys
  tools/
    contacts/                  # 5 tools: create, get, list, update, delete
    verification/              # 4 tools: verify, batch, autocomplete, lookup
    letters/                   # 4 tools: create, get, list, cancel
    bank-accounts/             # 4 tools: create, get, list, delete
    cheques/                   # 4 tools: create, get, list, cancel
    templates/                 # 5 tools: create, get, list, update, delete
    utility/                   # 2 tools: estimate-cost, account-summary
  types/
    tool-definition.ts         # ToolDefinition interface
    postgrid.types.ts          # PostGrid API response types
```

## Conventions

- Each tool file exports `ToolExport: ToolDefinition`
- Tools use `printClient` or `verifyClient` singleton for API calls
- Every tool response is prefixed with `[TEST]` or `[LIVE]` via `client.getModePrefix()`
- Create tools (letters, cheques) use two-step confirmation: preview first, then `confirmed: true`
- All money amounts use string-based `dollarsToCents()` to avoid floating-point bugs
- List endpoints use skip/limit pagination, capped at 100

## Build

```bash
npm install
npm run build   # tsc → dist/
```

## Environment Variables

- `POSTGRID_PRINT_API_KEY` — Print & Mail API key (required for most tools)
- `POSTGRID_VERIFY_API_KEY` — Address Verification API key (required for verify tools)
- `POSTGRID_CONFIRM_LIVE_MODE=true` — Required when using live keys
