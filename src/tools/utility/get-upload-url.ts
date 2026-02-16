import { r2Client } from "../../clients/r2-client.js";
import { formatError } from "../../helpers/format-error.js";
import { ToolDefinition } from "../../types/tool-definition.js";

export const ToolExport: ToolDefinition = {
  name: "postgrid_get_upload_url",
  description:
    "Get a presigned URL to upload a PDF directly to cloud storage. " +
    "Returns a PUT URL (for uploading) and a GET URL (for use as `uploadedPDF` in postgrid_create_letter). " +
    "Workflow: (1) call this tool, (2) upload the PDF to the PUT URL via curl, (3) pass the GET URL to postgrid_create_letter. " +
    "Use this from Cowork or sandboxed environments where file system access is unavailable.",
  schema: {},
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  handler: async () => {
    try {
      const { key, putUrl, getUrl } = await r2Client.generatePresignedPutUrl();

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Upload URL generated successfully.`,
              ``,
              `PUT URL (upload your PDF here, expires in 5 minutes):`,
              putUrl,
              ``,
              `GET URL (use as \`uploadedPDF\` in postgrid_create_letter, expires in 5 minutes):`,
              getUrl,
              ``,
              `Upload command:`,
              `curl -X PUT -H "Content-Type: application/pdf" --upload-file /path/to/file.pdf "${putUrl}"`,
              ``,
              `File auto-deletes: 24 hours`,
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
