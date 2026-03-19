import { NextRequest } from "next/server";
import { getAnthropicClient } from "@/lib/ai/client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { content } = await req.json() as { content: string };

  if (!content?.trim()) {
    return new Response("Content is required", { status: 400 });
  }

  // Limit content size to prevent abuse
  const trimmed = content.slice(0, 50_000);

  let client;
  try {
    client = getAnthropicClient();
  } catch {
    return new Response("AI service not configured", { status: 503 });
  }

  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system: `You are an expert on Claude Code and CLAUDE.md best practices.
Analyze the provided CLAUDE.md file and give specific, actionable feedback.
Focus on:
1. Workflow orchestration clarity
2. Rule specificity and actionability
3. Missing critical sections
4. Conflicting or redundant instructions
5. Claude Code-specific optimizations

Format your response in clear sections with markdown. Be concise but thorough.
Output in the same language as the CLAUDE.md content (Japanese, English, or Korean).`,
    messages: [
      {
        role: "user",
        content: `Please review this CLAUDE.md file and provide expert feedback:\n\n\`\`\`markdown\n${trimmed}\n\`\`\``,
      },
    ],
  });

  // Return as a ReadableStream for SSE
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const data = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
