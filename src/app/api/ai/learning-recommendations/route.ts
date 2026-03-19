import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/client";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db } from "@/lib/db/client";
import { userSkills } from "@/lib/db/schema/user-skills";
import { skills } from "@/lib/db/schema/skills";
import { eq, inArray } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locale = req.nextUrl.searchParams.get("locale") ?? "ko";

  // Fetch user's current skills
  let userSkillRows: Array<{ skillId: string; status: string }> = [];
  let skillDetails: Array<{ name: string; slug: string; description: string | null }> = [];

  try {
    userSkillRows = await db
      .select({ skillId: userSkills.skillId, status: userSkills.status })
      .from(userSkills)
      .where(eq(userSkills.userId, user.id));

    if (userSkillRows.length > 0) {
      skillDetails = await db
        .select({ name: skills.name, slug: skills.slug, description: skills.description })
        .from(skills)
        .where(inArray(skills.id, userSkillRows.map((r) => r.skillId)));
    }
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  let client;
  try {
    client = getAnthropicClient();
  } catch {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
  }

  const completed = skillDetails.filter((_, i) => userSkillRows[i]?.status === "completed");
  const inProgress = skillDetails.filter((_, i) => userSkillRows[i]?.status === "in_progress");

  const langInstruction =
    locale === "ko"
      ? "Respond in Korean."
      : locale === "ja"
        ? "Respond in Japanese."
        : "Respond in English.";

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system: `You are a learning advisor for an AI/Claude Code learning platform.
Based on the user's skill profile, recommend 3-5 specific next skills or topics to learn.
${langInstruction}
Return a JSON object with this exact structure:
{
  "summary": "1-2 sentence personalized learning assessment",
  "recommendations": [
    {
      "title": "Skill or topic name",
      "reason": "Why this is the right next step",
      "priority": "high" | "medium" | "low"
    }
  ]
}`,
    messages: [
      {
        role: "user",
        content: `My learning profile:
- Completed skills: ${completed.map((s) => s.name).join(", ") || "none yet"}
- In progress: ${inProgress.map((s) => s.name).join(", ") || "none"}

What should I learn next?`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock?.type === "text" ? textBlock.text : "";

  try {
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]) as {
      summary: string;
      recommendations: Array<{ title: string; reason: string; priority: string }>;
    };
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      summary: text,
      recommendations: [],
    });
  }
}
