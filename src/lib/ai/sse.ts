/**
 * Minimal Server-Sent Events reader that works with `expo/fetch` streaming
 * responses, and falls back to reading the whole body when streaming
 * isn't available (e.g. some web/proxy setups).
 */
export async function readSSE(
  res: { body?: any; text: () => Promise<string> },
  onEvent: (data: string, event?: string) => void,
): Promise<void> {
  let buffer = "";

  const flush = (final: boolean) => {
    buffer = buffer.replace(/\r\n/g, "\n");
    const blocks = buffer.split("\n\n");
    buffer = final ? "" : (blocks.pop() ?? "");
    for (const block of blocks) {
      if (!block.trim()) continue;
      let event: string | undefined;
      const data: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith(":")) continue; // comment / keep-alive
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
      }
      if (data.length) onEvent(data.join("\n"), event);
    }
  };

  const body = res.body;
  if (!body || typeof body.getReader !== "function") {
    buffer = await res.text();
    flush(true);
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    flush(false);
  }
  buffer += decoder.decode();
  flush(true);
}
