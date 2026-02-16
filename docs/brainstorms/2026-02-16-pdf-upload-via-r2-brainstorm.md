# PDF Upload via Cloudflare R2

**Date:** 2026-02-16
**Status:** Ready for planning

## Problem

PostGrid's `create_letter` API accepts letter content as:
- Inline HTML
- Template ID
- **URL to a hosted PDF** (`uploadedPDF` field)

The PDF URL must be publicly accessible (or at least fetchable by PostGrid's servers). This is a problem when:
- Working in Cowork (sandboxed, no local filesystem access)
- Working in Claude Code with a local PDF file
- Using other agents that don't have a file hosting service

There's no way to pass a local PDF to PostGrid without first hosting it somewhere.

## What We're Building

A **PDF upload tool** built into the PostGrid MCP server that:
1. Accepts PDF content (base64 or local file path)
2. Uploads it to a private Cloudflare R2 bucket
3. Returns a short-lived presigned GET URL
4. PostGrid fetches the PDF via that URL when creating the letter
5. R2 auto-deletes the file after 24 hours (lifecycle rule)

## Why Cloudflare R2

- **Free tier**: 10GB storage, 1M writes/month, unlimited reads — more than enough
- **Zero egress fees**: PostGrid fetching the PDF costs $0
- **S3-compatible**: Presigned URLs work natively via `@aws-sdk/s3-request-presigner`
- **Lifecycle rules**: Auto-delete objects after N days for zero retention
- **Nate already has a Cloudflare account**

## Key Decisions

1. **New tool name**: `postgrid_upload_pdf` — uploads a PDF, returns a presigned URL
2. **Input format**: Accept both `filePath` (Claude Code) and `base64` (Cowork/agents) — tool detects which is provided
3. **Presigned URL expiry**: 1 hour (enough for PostGrid to fetch, short enough for security)
4. **Object lifecycle**: 24-hour auto-deletion via R2 lifecycle rule
5. **Bucket privacy**: Private bucket, no public access. Only presigned URLs grant read access.
6. **Credential pattern**: R2 credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`) in env vars, scrubbed after first load (same pattern as PostGrid keys)
7. **No new dependencies**: Use `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (standard, well-maintained)
8. **File naming**: UUID-based keys (`pdfs/{uuid}.pdf`) — no PII in object keys
9. **Workflow**: Upload returns URL → pass URL to `postgrid_create_letter` as `uploadedPDF` — two separate tool calls, composable

## Open Questions

None — all resolved during brainstorm.

## Out of Scope

- Multi-file upload (one PDF per tool call)
- Non-PDF file types
- Long-term file storage or retrieval
- R2 bucket creation (manual setup step documented in README)
