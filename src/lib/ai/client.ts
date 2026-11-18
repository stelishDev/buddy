import { fetch } from "expo/fetch";
import { DEFAULT_BASE_URL } from "./presets";
import { readSSE } from "./sse";
import type { ChatRequest, ProviderConfig } from "./types";

const trimSlash = (s: string) => s.replace(/\/+$/, "");

function baseUrlFor(p: ProviderConfig): string {
  const url = trimSlash(p.baseUrl?.trim() || DEFAULT_BASE_URL[p.kind]);
  if (!url) throw new Error(`${p.name}: no base URL set`);
  return url;
}

async function ensureOk(res: Response | any, p: ProviderConfig) {
  if (res.ok) return;
  let detail = "";
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      detail = json?.error?.message ?? json?.message ?? json?.error ?? text;
      if (typeof detail !== "string") detail = JSON.stringify(detail);
    } catch {
      detail = text;
    }
  } catch {
    // ignore
  }
  const hint =
    res.status === 401 || res.status === 403
      ? " (check the API key)"
      : res.status === 404
        ? " (check the model name / base URL)"
        : res.status === 429
          ? " (rate limited or out of credit)"
          : "";
  throw new Error(`${p.name}: HTTP ${res.status}${hint}${detail ? ` — ${detail.slice(0, 300)}` : ""}`);
}

function headersFor(p: ProviderConfig, apiKey: string | null): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  switch (p.kind) {
    case "anthropic":
      if (apiKey) h["x-api-key"] = apiKey;
      h["anthropic-version"] = "2023-06-01";
      // Only matters when running on web; harmless on native.
      h["anthropic-dangerous-direct-browser-access"] = "true";
      break;
    case "gemini":
      if (apiKey) h["x-goog-api-key"] = apiKey;
      break;
    default:
      if (apiKey) h["Authorization"] = `Bearer ${apiKey}`;
      if (baseUrlFor(p).includes("openrouter.ai")) h["X-Title"] = "Meeting Copilot";
  }
  return h;
}

/**
 * Streams a chat completion from any supported provider.
 * Returns the full text once complete; `req.onToken` receives deltas.
 */
export async function streamChat(
  p: ProviderConfig,
  apiKey: string | null,
  req: ChatRequest,
): Promise<string> {
  const base = baseUrlFor(p);
  const headers = headersFor(p, apiKey);
  let full = "";
  const emit = (t: string | undefined | null) => {
    if (!t) return;
    full += t;
    req.onToken?.(t);
  };

  if (p.kind === "anthropic") {
    const res = await fetch(`${base}/messages`, {
      method: "POST",
      headers,
      signal: req.signal,
      body: JSON.stringify({
        model: p.model,
        max_tokens: req.maxTokens ?? 2048,
        system: req.system,
        messages: req.messages,
        stream: true,
      }),
    });
    await ensureOk(res, p);
    await readSSE(res, (data) => {
      const json = JSON.parse(data);
      if (json.type === "content_block_delta" && json.delta?.type === "text_delta") emit(json.delta.text);
      else if (json.type === "error") throw new Error(`${p.name}: ${json.error?.message ?? "stream error"}`);
    });
    return full;
  }

  if (p.kind === "gemini") {
    const model = p.model.replace(/^models\//, "");
    const res = await fetch(`${base}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers,
      signal: req.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: req.messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }),
    });
    await ensureOk(res, p);
    await readSSE(res, (data) => {
      const json = JSON.parse(data);
      if (json.error) throw new Error(`${p.name}: ${json.error.message}`);
      const parts: any[] = json.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) if (!part.thought) emit(part.text);
    });
    return full;
  }

  // OpenAI and OpenAI-compatible (OpenRouter, Groq, Mistral, Ollama, ...)
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers,
    signal: req.signal,
    body: JSON.stringify({
      model: p.model,
      messages: [{ role: "system", content: req.system }, ...req.messages],
      stream: true,
    }),
  });
  await ensureOk(res, p);
  await readSSE(res, (data) => {
    if (data === "[DONE]") return;
    const json = JSON.parse(data);
    if (json.error) throw new Error(`${p.name}: ${json.error.message ?? "stream error"}`);
    emit(json.choices?.[0]?.delta?.content);
  });
  return full;
}

/** Lists model ids available to the account (used by the "Load models" button). */
export async function listModels(p: ProviderConfig, apiKey: string | null): Promise<string[]> {
  const base = baseUrlFor(p);
  const headers = headersFor(p, apiKey);
  let ids: string[] = [];

  if (p.kind === "gemini") {
    const res = await fetch(`${base}/models?pageSize=200`, { headers });
    await ensureOk(res, p);
    const json: any = await res.json();
    ids = (json.models ?? [])
      .filter((m: any) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
      .map((m: any) => String(m.name).replace(/^models\//, ""));
  } else if (p.kind === "anthropic") {
    const res = await fetch(`${base}/models?limit=100`, { headers });
    await ensureOk(res, p);
    const json: any = await res.json();
    ids = (json.data ?? []).map((m: any) => m.id);
  } else {
    const res = await fetch(`${base}/models`, { headers });
    await ensureOk(res, p);
    const json: any = await res.json();
    ids = (json.data ?? json.models ?? []).map((m: any) => m.id ?? m.name);
  }
  return Array.from(new Set(ids.filter(Boolean))).sort();
}

/** Sends a tiny request to confirm key + model work. */
export async function testConnection(p: ProviderConfig, apiKey: string | null): Promise<string> {
  const reply = await streamChat(p, apiKey, {
    system: "You are a connectivity check. Reply with the single word OK.",
    messages: [{ role: "user", content: "Ping" }],
    maxTokens: 16,
  });
  return reply.trim() || "(empty reply)";
}
