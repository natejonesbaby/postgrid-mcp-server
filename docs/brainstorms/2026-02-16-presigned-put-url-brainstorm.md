# Brainstorm: Presigned PUT URL for Cowork PDF Upload

**Date:** 2026-02-16
**Status:** Approved
**Builds on:** `2026-02-16-pdf-upload-via-r2-brainstorm.md`

## What We're Building

A new MCP tool (`postgrid_get_upload_url`) that returns a presigned S3 PUT URL for Cloudflare R2. This lets Cowork (and any sandboxed agent) upload PDFs directly to R2 via `curl` or `fetch`, bypassing the MCP stdio pipe entirely. The PDF bytes never flow through the MCP server or the LLM token stream.

## Why This Approach

### The Problem

In Cowork's sandboxed environment:
- **`filePath`** doesn't work — the MCP server runs on the user's local machine, not in Cowork's sandbox
- **`base64`** hits token limits — an 89KB PDF becomes ~119KB of base64 text, which exceeds what can be passed as a single MCP tool argument through the LLM conversation
- **ngrok/tunneling** failed — free tier serves an HTML interstitial that PostGrid receives instead of the PDF
- **Free file hosts** all failed (file.io redirects, 0x0.st blocks agents, transfer.sh is down)

### The Solution: Presigned PUT URL

The standard cloud pattern for uploading from untrusted/sandboxed environments:

1. Agent calls `postgrid_get_upload_url` (tiny MCP call — just returns URLs)
2. MCP server generates a presigned S3 PUT URL (5-minute expiry, scoped to one key)
3. Agent uses `curl -X PUT --upload-file <path> <presigned-url>` to send raw bytes directly to R2
4. MCP server also returns the presigned GET URL for use with `postgrid_create_letter`

The heavy data transfer (PDF bytes) goes directly from Cowork to R2 over HTTPS. The MCP pipe only carries lightweight JSON.

### Why Not Alternatives

| Approach | Problem |
|----------|---------|
| Chunked base64 | Still flows through token stream, just in pieces. Hacky. |
| HTTP sidecar | Adds Express endpoint, port management, firewall concerns. Over-engineered. |
| URL fetch from Cowork | Cowork can't reliably host/expose files at a public URL. |

## Key Decisions

1. **Keep the existing `postgrid_upload_pdf` tool** — it works perfectly for Claude Code (local filePath). The new tool is additive, not a replacement.
2. **New tool: `postgrid_get_upload_url`** — returns both a PUT URL (for uploading) and a GET URL (for PostGrid to fetch). Both are presigned with 5-minute expiry.
3. **No server-side validation on presigned upload** — the PUT URL allows any content. The agent is responsible for uploading a valid PDF. PostGrid will reject non-PDF content at letter creation time, which is sufficient validation.
4. **Same R2 bucket and lifecycle** — uses `postgrid-pdfs` bucket with existing 24-hour auto-delete lifecycle rule.
5. **ContentType enforcement** — the presigned PUT URL will require `Content-Type: application/pdf` to prevent misuse.

## Tool Design

### `postgrid_get_upload_url`

**Input:** None required (optionally accept a `filename` for the Content-Disposition header)

**Output:**
```
Upload URL generated successfully.

PUT URL (upload your PDF here, expires in 5 minutes):
https://postgrid-pdfs.dda05936...r2.cloudflarestorage.com/pdfs/uuid.pdf?X-Amz-...

GET URL (use as uploadedPDF in postgrid_create_letter, expires in 5 minutes):
https://postgrid-pdfs.dda05936...r2.cloudflarestorage.com/pdfs/uuid.pdf?X-Amz-...

Upload command:
curl -X PUT -H "Content-Type: application/pdf" --upload-file /path/to/file.pdf "<PUT_URL>"
```

### Cowork Workflow

```
1. postgrid_get_upload_url          → returns PUT URL + GET URL
2. curl -X PUT ... <PUT_URL>        → uploads PDF directly to R2
3. postgrid_create_letter(          → creates letter with R2-hosted PDF
     uploadedPDF: <GET_URL>,
     to: "contact_xxx",
     from: "contact_yyy"
   )
```

## Open Questions

None — all decisions resolved during brainstorm.
