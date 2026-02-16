import { readFile } from "node:fs/promises";
import { r2Client } from "../../clients/r2-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";
import { z } from "zod";

const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50 MB

export const ToolExport: ToolDefinition = {
  name: "postgrid_upload_pdf",
  description:
    "Upload a PDF to temporary storage and get a URL that PostGrid can access. " +
    "Use this before postgrid_create_letter when you have a PDF file to mail. " +
    "Accepts either a local file path or base64-encoded PDF content. " +
    "The URL expires after 5 minutes and the file is auto-deleted after 24 hours.",
  schema: {
    filePath: z
      .string()
      .optional()
      .describe(
        "Absolute path to a local PDF file. Use this from Claude Code or other file-system-accessible environments."
      ),
    base64: z
      .string()
      .optional()
      .describe(
        "Base64-encoded PDF content. Use this from Cowork or sandboxed environments where file system access is unavailable."
      ),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  handler: async (args: { filePath?: string; base64?: string }) => {
    try {
      if (!args.filePath && !args.base64) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: Provide either filePath (local file) or base64 (encoded PDF content). One is required.",
            },
          ],
        };
      }

      if (args.filePath && args.base64) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: Provide either filePath or base64, not both.",
            },
          ],
        };
      }

      let buffer: Buffer;

      if (args.filePath) {
        buffer = await readFile(args.filePath);
      } else {
        buffer = Buffer.from(args.base64!, "base64");
      }

      // Size limit
      if (buffer.length > MAX_PDF_SIZE) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: PDF exceeds maximum size of ${MAX_PDF_SIZE / 1024 / 1024} MB.`,
            },
          ],
        };
      }

      // PDF magic bytes validation
      if (buffer.length < 5 || buffer.subarray(0, 5).toString() !== "%PDF-") {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: The provided content does not appear to be a valid PDF file.",
            },
          ],
        };
      }

      const { key, url } = await r2Client.uploadPdf(buffer);
      const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `PDF uploaded successfully.`,
              ``,
              `Size: ${sizeMB} MB`,
              `Key: ${key}`,
              `URL expires: 5 minutes`,
              `File auto-deletes: 24 hours`,
              ``,
              `Use this URL as the \`uploadedPDF\` parameter in postgrid_create_letter:`,
              `${url}`,
            ].join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: formatError(error) }],
      };
    }
  },
};
