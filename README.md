# PostGrid MCP Server

MCP server for PostGrid Print & Mail and Address Verification APIs. Send letters (standard, certified, certified with return receipt), mail MICR-encoded checks, manage contacts and templates, and verify US/Canadian addresses — all from Claude.

## Tools (28)

### Contacts
- `postgrid_create_contact` — Create a mailing contact
- `postgrid_get_contact` — Get contact details
- `postgrid_list_contacts` — List contacts with search and pagination
- `postgrid_update_contact` — Update contact fields
- `postgrid_delete_contact` — Delete a contact

### Address Verification
- `postgrid_verify_address` — Verify and standardize an address (structured or freeform)
- `postgrid_verify_addresses_batch` — Verify up to 2,000 addresses at once
- `postgrid_autocomplete_address` — Autocomplete a partial address
- `postgrid_lookup_city_state` — Look up city/state from a ZIP code

### Letters
- `postgrid_create_letter` — Send a letter (first class, standard, certified, or certified with return receipt)
- `postgrid_get_letter` — Get letter status and tracking
- `postgrid_list_letters` — List letters with search and pagination
- `postgrid_cancel_letter` — Cancel a letter before it prints

### Bank Accounts
- `postgrid_create_bank_account` — Register a bank account for check payments
- `postgrid_get_bank_account` — Get bank account details (numbers masked)
- `postgrid_list_bank_accounts` — List bank accounts
- `postgrid_delete_bank_account` — Delete a bank account

### Checks
- `postgrid_create_cheque` — Send a MICR-encoded check
- `postgrid_get_cheque` — Get check status
- `postgrid_list_cheques` — List checks with pagination
- `postgrid_cancel_cheque` — Cancel a check before it prints

### Templates
- `postgrid_create_template` — Create an HTML template with Handlebars merge variables
- `postgrid_get_template` — Get template details and HTML content
- `postgrid_list_templates` — List templates
- `postgrid_update_template` — Update template HTML or description
- `postgrid_delete_template` — Delete a template

### Utility
- `postgrid_estimate_cost` — Estimate mailing cost without an API call
- `postgrid_account_summary` — Show API mode, connectivity, and rate table

## Setup

### 1. Get API Keys

Sign up at [postgrid.com](https://www.postgrid.com) and get your API keys from the dashboard:

- **Print & Mail API key** — for contacts, letters, checks, templates
- **Address Verification API key** — for address verification tools

Both test and live keys are supported. Test keys start with `test_` and live keys start with `live_`.

### 2. Install

```bash
git clone https://github.com/nathanieljones/postgrid-mcp-server.git
cd postgrid-mcp-server
npm install
```

### 3. Configure

Create a `.env` file (or set environment variables):

```bash
POSTGRID_PRINT_API_KEY=test_sk_...
POSTGRID_VERIFY_API_KEY=test_sk_...
```

For live keys, you must also set:

```bash
POSTGRID_CONFIRM_LIVE_MODE=true
```

This prevents accidental sends with real postage.

### 4. Add to Claude

**Claude Code** (`~/.claude.json`):

```json
{
  "mcpServers": {
    "postgrid": {
      "command": "node",
      "args": ["/full/path/to/postgrid-mcp-server/dist/index.js"],
      "env": {
        "POSTGRID_PRINT_API_KEY": "test_sk_...",
        "POSTGRID_VERIFY_API_KEY": "test_sk_..."
      }
    }
  }
}
```

**Claude Desktop / Cowork** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "postgrid": {
      "command": "node",
      "args": ["/full/path/to/postgrid-mcp-server/dist/index.js"],
      "env": {
        "POSTGRID_PRINT_API_KEY": "test_sk_...",
        "POSTGRID_VERIFY_API_KEY": "test_sk_..."
      }
    }
  }
}
```

## Safety Features

**Two-step confirmation** — `postgrid_create_letter` and `postgrid_create_cheque` require two calls. The first returns a cost preview; the second (with `confirmed: true`) actually sends.

**Live mode gate** — Live API keys require `POSTGRID_CONFIRM_LIVE_MODE=true` in the environment. Without it, the server refuses to start with live keys.

**Mode indicators** — Every response is prefixed with `[TEST]` or `[LIVE]` so you always know which mode you're in.

**Check safety thresholds** — Checks over $10,000 show a warning. Checks over $100,000 are rejected.

**Account number masking** — Bank account and routing numbers are masked in all responses.

**Idempotency** — Create operations include deterministic idempotency keys so retries don't produce duplicates.

## Rate Table

| Type | Class | B&W | Color |
|------|-------|-----|-------|
| Letter (1 page) | First Class | $1.14 | $1.29 |
| Letter (1 page) | Standard | $0.76 | $0.91 |
| Letter (1 page) | Certified | $5.00 | $5.15 |
| Letter (1 page) | Certified + Return Receipt | $7.43 | $7.58 |
| Extra page | — | +$0.07 | +$0.13 |
| Check | First Class | $2.50 | — |

Use `postgrid_estimate_cost` to calculate costs before sending.

## License

MIT
