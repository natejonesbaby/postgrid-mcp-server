import { PostGridClientBase } from "./postgrid-client-base.js";

class PostGridPrintClient extends PostGridClientBase {
  protected readonly baseUrl = "https://api.postgrid.com/print-mail/v1";
  protected readonly apiKeyEnvVar = "POSTGRID_PRINT_API_KEY";
}

export const printClient = new PostGridPrintClient();
