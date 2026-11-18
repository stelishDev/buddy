export type ProviderKind = "openai" | "anthropic" | "gemini" | "openai-compatible";

export interface ProviderConfig {
  id: string;
  /** Display name, e.g. "My OpenRouter" */
  name: string;
  kind: ProviderKind;
  /** API base URL. Defaults per kind when empty. */
  baseUrl?: string;
  /** Model identifier sent to the API. */
  model: string;
  createdAt: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  signal?: AbortSignal;
  /** Called with each streamed text delta. */
  onToken?: (delta: string) => void;
}
