/**
 * lib/ai/nimClient.ts
 *
 * Thin, production-grade HTTP client for the NVIDIA NIM API.
 *
 * NVIDIA NIM exposes an OpenAI-compatible API endpoint, so we use the standard
 * `/chat/completions` path with Bearer token authentication.
 *
 * Handles:
 * - Missing / invalid environment variables (fail-fast with clear error)
 * - Authentication errors (401) → ChatError with code AUTH_ERROR
 * - Rate limiting (429) → exponential backoff retry (up to MAX_RETRIES)
 * - Request timeouts (AbortController with configurable TTL)
 * - Empty / malformed responses → ChatError with code EMPTY_RESPONSE
 * - Network failures → ChatError with code NETWORK_ERROR
 * - Server errors (5xx) → ChatError with code UNKNOWN, logged to console
 */

import type { ChatMessage } from "./types";

const DEFAULT_MODEL = "meta/llama-3.1-8b-instruct";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1_000;

export interface NimClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface NimStreamResponse {
  /** Returns an async iterable of text deltas */
  stream: AsyncIterable<string>;
}

export class NimClient {
  private readonly config: NimClientConfig;

  constructor(config?: Partial<NimClientConfig>) {
    const apiKey = config?.apiKey ?? process.env.NVIDIA_NIM_API_KEY ?? "";
    const baseUrl =
      config?.baseUrl ??
      process.env.NVIDIA_NIM_BASE_URL ??
      DEFAULT_BASE_URL;
    const model =
      config?.model ?? process.env.NVIDIA_NIM_MODEL ?? DEFAULT_MODEL;

    if (!apiKey) {
      throw new Error(
        "[NimClient] NVIDIA_NIM_API_KEY is not set. Add it to .env.local."
      );
    }

    this.config = { apiKey, baseUrl, model };
  }

  /**
   * Stream a chat completion response.
   * Returns an AsyncIterable<string> that yields text deltas as they arrive.
   */
  async streamChat(messages: ChatMessage[]): Promise<AsyncIterable<string>> {
    const response = await this.fetchWithRetry(messages, true);
    return this.parseSSEStream(response);
  }

  /**
   * Send a single (non-streaming) chat completion request.
   * Used as a fallback when streaming is unavailable.
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await this.fetchWithRetry(messages, false);
    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content;
    if (!text) {
      throw Object.assign(new Error("Empty response from NVIDIA NIM"), {
        code: "EMPTY_RESPONSE",
      });
    }
    return text as string;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async fetchWithRetry(
    messages: ChatMessage[],
    stream: boolean,
    attempt = 0
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort("timeout"),
      REQUEST_TIMEOUT_MS
    );

    try {
      const response = await fetch(
        `${this.config.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
            Accept: stream ? "text/event-stream" : "application/json",
          },
          body: JSON.stringify({
            model: this.config.model,
            messages,
            stream,
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 1024,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.status === 401) {
        throw Object.assign(
          new Error("Invalid NVIDIA NIM API key (401 Unauthorized)"),
          { code: "AUTH_ERROR" }
        );
      }

      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `[NimClient] Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1})`
          );
          await sleep(delay);
          return this.fetchWithRetry(messages, stream, attempt + 1);
        }
        throw Object.assign(
          new Error("NVIDIA NIM rate limit exceeded after retries"),
          { code: "RATE_LIMIT" }
        );
      }

      if (!response.ok) {
        const body = await response.text().catch(() => "(unreadable body)");
        console.error(`[NimClient] HTTP ${response.status}: ${body}`);
        throw Object.assign(
          new Error(`NVIDIA NIM returned HTTP ${response.status}`),
          { code: "UNKNOWN" }
        );
      }

      return response;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      // Rethrow structured errors we already created
      if (err instanceof Error && "code" in err) throw err;

      // AbortController timeout
      if (err instanceof Error && err.name === "AbortError") {
        throw Object.assign(
          new Error("Request to NVIDIA NIM timed out after 30s"),
          { code: "TIMEOUT" }
        );
      }

      // Generic network / fetch failure
      throw Object.assign(
        new Error(
          `Network error reaching NVIDIA NIM: ${err instanceof Error ? err.message : String(err)}`
        ),
        { code: "NETWORK_ERROR" }
      );
    }
  }

  /**
   * Parse a Server-Sent Events response body into an AsyncIterable<string>
   * that yields text deltas chunk by chunk.
   */
  private async *parseSSEStream(response: Response): AsyncIterable<string> {
    if (!response.body) {
      throw Object.assign(new Error("Response body is null"), {
        code: "EMPTY_RESPONSE",
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data);
            const delta: string =
              parsed?.choices?.[0]?.delta?.content ?? "";
            if (delta) yield delta;
          } catch {
            // Malformed SSE data — skip silently
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/** Module-level singleton, initialized lazily to allow env var validation at request time */
let _client: NimClient | null = null;

export function getNimClient(): NimClient {
  if (!_client) {
    _client = new NimClient();
  }
  return _client;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
