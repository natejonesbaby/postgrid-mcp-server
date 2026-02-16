import { PostGridClientBase } from "./postgrid-client-base.js";

class PostGridVerifyClient extends PostGridClientBase {
  protected readonly baseUrl = "https://api.postgrid.com/v1/addver";
  protected readonly apiKeyEnvVar = "POSTGRID_VERIFY_API_KEY";
}

export const verifyClient = new PostGridVerifyClient();
