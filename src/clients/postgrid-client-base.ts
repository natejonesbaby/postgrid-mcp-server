/**
 * Base HTTP client for PostGrid APIs.
 * Handles authentication, timeouts, error parsing, and mode detection.
 */
export abstract class PostGridClientBase {
  protected abstract readonly baseUrl: string;
  protected abstract readonly apiKeyEnvVar: string;

  #apiKey: string | undefined;
  #mode: "test" | "live" | undefined;

  protected getApiKey(): string {
    if (!this.#apiKey) {
      this.#apiKey = process.env[this.apiKeyEnvVar];
      // Scrub from process.env to prevent leakage via tools that inspect env
      delete process.env[this.apiKeyEnvVar];

      if (!this.#apiKey) {
        throw new Error(`${this.apiKeyEnvVar} environment variable is not set`);
      }

      // Detect mode
      this.#mode = this.#apiKey.startsWith("test_sk_") ? "test" : "live";

      // Safety gate for live mode
      if (this.#mode === "live" && process.env.POSTGRID_CONFIRM_LIVE_MODE !== "true") {
        throw new Error(
          "SAFETY: Live API keys detected but POSTGRID_CONFIRM_LIVE_MODE is not set to \"true\". " +
          "Set this environment variable to confirm you intend to use live mode."
        );
      }
    }
    return this.#apiKey;
  }

  getMode(): "test" | "live" {
    this.getApiKey(); // Ensure key is loaded
    return this.#mode!;
  }

  getModePrefix(): string {
    return `[${this.getMode().toUpperCase()}]`;
  }

  protected async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string | number | boolean | undefined>;
      idempotencyKey?: string;
    }
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const headers: Record<string, string> = {
        "x-api-key": this.getApiKey(),
        "Accept": "application/json",
      };

      if (options?.body) {
        headers["Content-Type"] = "application/json";
      }

      if (options?.idempotencyKey) {
        headers["Idempotency-Key"] = options.idempotencyKey;
      }

      const res = await fetch(url.toString(), {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as any;
        const message = errBody?.error?.message || errBody?.message || res.statusText;
        const type = errBody?.error?.type || "api_error";
        throw new Error(`PostGrid API ${res.status} (${type}): ${message}`);
      }

      const text = await res.text();
      if (!text) return {} as T;
      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("PostGrid API request timed out (15s)");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  async post<T>(
    path: string,
    body: unknown,
    idempotencyKey?: string
  ): Promise<T> {
    return this.request<T>("POST", path, { body, idempotencyKey });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}
