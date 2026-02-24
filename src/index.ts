#!/usr/bin/env node

import "dotenv/config";
import { createServer } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { PostGridMCPServer } from "./server/postgrid-mcp-server.js";
import { RegisterTool } from "./helpers/register-tool.js";

// ── Contacts ────────────────────────────────────────────────
import { ToolExport as CreateContact } from "./tools/contacts/create-contact.js";
import { ToolExport as GetContact } from "./tools/contacts/get-contact.js";
import { ToolExport as ListContacts } from "./tools/contacts/list-contacts.js";
import { ToolExport as UpdateContact } from "./tools/contacts/update-contact.js";
import { ToolExport as DeleteContact } from "./tools/contacts/delete-contact.js";

// ── Address Verification ────────────────────────────────────
import { ToolExport as VerifyAddress } from "./tools/verification/verify-address.js";
import { ToolExport as VerifyAddressesBatch } from "./tools/verification/verify-addresses-batch.js";
import { ToolExport as AutocompleteAddress } from "./tools/verification/autocomplete-address.js";
import { ToolExport as LookupCityState } from "./tools/verification/lookup-city-state.js";

// ── Letters ─────────────────────────────────────────────────
import { ToolExport as CreateLetter } from "./tools/letters/create-letter.js";
import { ToolExport as GetLetter } from "./tools/letters/get-letter.js";
import { ToolExport as ListLetters } from "./tools/letters/list-letters.js";
import { ToolExport as CancelLetter } from "./tools/letters/cancel-letter.js";

// ── Bank Accounts ───────────────────────────────────────────
import { ToolExport as CreateBankAccount } from "./tools/bank-accounts/create-bank-account.js";
import { ToolExport as GetBankAccount } from "./tools/bank-accounts/get-bank-account.js";
import { ToolExport as ListBankAccounts } from "./tools/bank-accounts/list-bank-accounts.js";
import { ToolExport as DeleteBankAccount } from "./tools/bank-accounts/delete-bank-account.js";

// ── Cheques ─────────────────────────────────────────────────
import { ToolExport as CreateCheque } from "./tools/cheques/create-cheque.js";
import { ToolExport as GetCheque } from "./tools/cheques/get-cheque.js";
import { ToolExport as ListCheques } from "./tools/cheques/list-cheques.js";
import { ToolExport as CancelCheque } from "./tools/cheques/cancel-cheque.js";

// ── Templates ───────────────────────────────────────────────
import { ToolExport as CreateTemplate } from "./tools/templates/create-template.js";
import { ToolExport as GetTemplate } from "./tools/templates/get-template.js";
import { ToolExport as ListTemplates } from "./tools/templates/list-templates.js";
import { ToolExport as UpdateTemplate } from "./tools/templates/update-template.js";
import { ToolExport as DeleteTemplate } from "./tools/templates/delete-template.js";

// ── Utility ─────────────────────────────────────────────────
import { ToolExport as EstimateCost } from "./tools/utility/estimate-cost.js";
import { ToolExport as AccountSummary } from "./tools/utility/account-summary.js";
import { ToolExport as UploadPdf } from "./tools/utility/upload-pdf.js";
import { ToolExport as GetUploadUrl } from "./tools/utility/get-upload-url.js";

// ── All tools ───────────────────────────────────────────────

const allTools = [
  // Contacts
  CreateContact,
  GetContact,
  ListContacts,
  UpdateContact,
  DeleteContact,
  // Address Verification
  VerifyAddress,
  VerifyAddressesBatch,
  AutocompleteAddress,
  LookupCityState,
  // Letters
  CreateLetter,
  GetLetter,
  ListLetters,
  CancelLetter,
  // Bank Accounts
  CreateBankAccount,
  GetBankAccount,
  ListBankAccounts,
  DeleteBankAccount,
  // Cheques
  CreateCheque,
  GetCheque,
  ListCheques,
  CancelCheque,
  // Templates
  CreateTemplate,
  GetTemplate,
  ListTemplates,
  UpdateTemplate,
  DeleteTemplate,
  // Utility
  EstimateCost,
  AccountSummary,
  UploadPdf,
  GetUploadUrl,
];

function registerAllTools() {
  const server = PostGridMCPServer.GetServer();
  for (const tool of allTools) {
    RegisterTool(server, tool);
  }
  return server;
}

async function startStdio() {
  const server = registerAllTools();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `PostGrid MCP Server running (stdio) with ${allTools.length} tools`
  );
}

async function startHttp() {
  const apiKey = process.env.MCP_API_KEY;

  // SECURITY: fail hard if API key not configured
  if (!apiKey) {
    console.error("FATAL: MCP_API_KEY is not set. Refusing to start in HTTP mode.");
    process.exit(1);
  }

  const port = parseInt(process.env.PORT ?? "3000", 10);

  // enableJsonResponse: true prevents SSE buffering on Railway's nginx proxy
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — correct for Railway
    enableJsonResponse: true,
  });

  // Hoist server to outer scope so signal handlers can drain it
  const server = registerAllTools();
  await server.connect(transport);

  const httpServer = createServer(async (req, res) => {
    // HTTP access logging — emit after response finishes for accurate status code
    res.on("finish", () => {
      console.error(`${req.method} ${req.url} → ${res.statusCode}`);
    });

    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    // Security headers on every response
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cache-Control", "no-store");

    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
      return;
    }

    if (url.pathname === "/mcp") {
      // Origin header validation (DNS rebinding prevention per updated MCP spec)
      const origin = req.headers.origin;
      if (origin && !isAllowedOrigin(origin)) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Forbidden origin" }));
        return;
      }

      // Timing-safe Bearer token comparison
      const tok = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "").trim();
      const expected = createHash("sha256").update(apiKey).digest();
      const actual = createHash("sha256").update(tok || "").digest();
      if (!timingSafeEqual(expected, actual)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      await transport.handleRequest(req, res);
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  });

  // Graceful shutdown: drain MCP transport first, then close HTTP server.
  // Pairs with drainingSeconds: 30 in railway.json.
  const shutdown = async (signal: string) => {
    console.error(`${signal} received, shutting down gracefully...`);
    try {
      await server.close(); // drain in-flight MCP requests
    } catch {
      // ignore errors during shutdown
    }
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 25_000);
  };

  process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
  process.on("SIGINT",  () => { void shutdown("SIGINT"); });

  httpServer.listen(port, "0.0.0.0", () =>
    console.error(`PostGrid MCP Server running (HTTP) on port ${port} with ${allTools.length} tools`)
  );
}

function isAllowedOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    /^https:\/\/.*\.railway\.app$/.test(origin);
}

const mode = process.env.MCP_TRANSPORT ?? "stdio";

if (mode === "http") {
  startHttp().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
} else {
  startStdio().catch((error) => {
    console.error("Fatal error starting PostGrid MCP Server:", error);
    process.exit(1);
  });
}
