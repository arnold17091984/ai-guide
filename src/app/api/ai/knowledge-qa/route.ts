import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/client";
import { db } from "@/lib/db/client";
import { knowledgeEntries } from "@/lib/db/schema/knowledge";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { slug, question, locale } = await req.json() as {
    slug: string;
    question: string;
    locale?: string;
  };

  if (!slug || !question?.trim()) {
    return NextResponse.json({ error: "slug and question are required" }, { status: 400 });
  }

  // Fetch the knowledge entry
  let entry: { titleKo: string; bodyKo: string | null } | undefined;
  try {
    const rows = await db
      .select({ titleKo: knowledgeEntries.titleKo, bodyKo: knowledgeEntries.bodyKo })
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.slug, slug))
      .limit(1);
    entry = rows[0];
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  let client;
  try {
    client = getAnthropicClient();
  } catch {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const langInstruction =
    locale === "ko"
      ? "Answer in Korean."
      : locale === "ja"
        ? "Answer in Japanese."
        : "Answer in English.";

  const content = entry.bodyKo?.slice(0, 30_000) ?? "";

  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system: `You are a helpful assistant answering questions about a specific knowledge article.
Base your answer only on the provided article content. ${langInstruction}
Be concise, clear, and practical. If the answer isn't in the article, say so.`,
    messages: [
      {
        role: "user",
        content: `Article: "${entry.titleKo}"\n\n${content}\n\n---\n\nQuestion: ${question}`,
      },
    ],
  });

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
