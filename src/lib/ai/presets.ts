import type { ProviderKind } from "./types";

export interface ProviderPreset {
  label: string;
  kind: ProviderKind;
  baseUrl: string;
  /** Shown as a placeholder only — use "Load models" to see what the account can use. */
  modelHint: string;
  keyRequired: boolean;
  keyHelp?: string;
}

export const DEFAULT_BASE_URL: Record<ProviderKind, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  "openai-compatible": "",
};

export const PRESETS: ProviderPreset[] = [
  {
    label: "OpenAI",
    kind: "openai",
    baseUrl: DEFAULT_BASE_URL.openai,
    modelHint: "Load models to pick one",
    keyRequired: true,
    keyHelp: "platform.openai.com → API keys",
  },
  {
    label: "Anthropic (Claude)",
    kind: "anthropic",
    baseUrl: DEFAULT_BASE_URL.anthropic,
    modelHint: "e.g. claude-sonnet-5-5",
    keyRequired: true,
    keyHelp: "console.anthropic.com → API keys",
  },
  {
    label: "Google Gemini",
    kind: "gemini",
    baseUrl: DEFAULT_BASE_URL.gemini,
    modelHint: "Load models to pick one",
    keyRequired: true,
    keyHelp: "aistudio.google.com → Get API key",
  },
  {
    label: "OpenRouter",
    kind: "openai-compatible",
    baseUrl: "https://openrouter.ai/api/v1",
    modelHint: "e.g. anthropic/claude-sonnet-5-5",
    keyRequired: true,
  },
  {
    label: "Groq",
    kind: "openai-compatible",
    baseUrl: "https://api.groq.com/openai/v1",
    modelHint: "Load models to pick one",
    keyRequired: true,
  },
  {
    label: "Mistral",
    kind: "openai-compatible",
    baseUrl: "https://api.mistral.ai/v1",
    modelHint: "Load models to pick one",
    keyRequired: true,
  },
  {
    label: "DeepSeek",
    kind: "openai-compatible",
    baseUrl: "https://api.deepseek.com/v1",
    modelHint: "Load models to pick one",
    keyRequired: true,
  },
  {
    label: "xAI (Grok)",
    kind: "openai-compatible",
    baseUrl: "https://api.x.ai/v1",
    modelHint: "Load models to pick one",
    keyRequired: true,
  },
  {
    label: "Ollama / LM Studio (local)",
    kind: "openai-compatible",
    baseUrl: "http://192.168.1.10:11434/v1",
    modelHint: "e.g. llama3.2",
    keyRequired: false,
    keyHelp: "Use your computer's LAN IP, not localhost",
  },
  {
    label: "Custom (OpenAI-compatible)",
    kind: "openai-compatible",
    baseUrl: "",
    modelHint: "Model id",
    keyRequired: false,
  },
];

export const KIND_LABEL: Record<ProviderKind, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Gemini",
  "openai-compatible": "OpenAI-compatible",
};
