#!/usr/bin/env node

import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

startStdio().catch((error) => {
  console.error("Fatal error starting PostGrid MCP Server:", error);
  process.exit(1);
});
