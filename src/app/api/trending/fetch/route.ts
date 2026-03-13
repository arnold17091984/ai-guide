import { NextRequest, NextResponse } from "next/server";

// ============================================================
// POST /api/trending/fetch — Trending content fetcher
// ============================================================
// Protected with CRON_SECRET via x-api-key header.
// Fetches trending content from HN, Reddit, and GitHub APIs.
// Called by a cron job on a scheduled interval.

export const runtime = "nodejs";

// Mock data structure that real API calls would return
interface TrendingItem {
  source: "hackernews" | "reddit" | "github";
  externalId: string;
  title: string;
  url: string;
  description?: string;
  score: number;
  commentCount: number;
  authorName?: string;
  publishedAt: string;
}

interface FetchResult {
  fetched: number;
  sources: {
    hackernews: TrendingItem[];
    reddit: TrendingItem[];
    github: TrendingItem[];
  };
  fetchedAt: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validate CRON_SECRET
  const apiKey = request.headers.get("x-api-key");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || apiKey !== cronSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    // ---------------------------------------------------------------------------
    // Hacker News — top stories filtered for AI/Claude relevance
    // ---------------------------------------------------------------------------
    // Real implementation would call:
    //   GET https://hacker-news.firebaseio.com/v0/topstories.json
    //   Then fetch each story: GET https://hacker-news.firebaseio.com/v0/item/{id}.json
    //   Filter for Claude, AI, LLM, coding keywords

    const hackerNewsItems: TrendingItem[] = [
      {
        source: "hackernews",
        externalId: "hn-39999001",
        title: "Claude Code: Best Practices for Large Codebases",
        url: "https://example.com/claude-code-practices",
        score: 342,
        commentCount: 87,
        authorName: "techuser42",
        publishedAt: new Date(Date.now() - 3_600_000).toISOString(),
      },
      {
        source: "hackernews",
        externalId: "hn-39999002",
        title: "Building an AI-assisted code review pipeline",
        url: "https://example.com/ai-code-review",
        description: "How we integrated Claude into our PR workflow",
        score: 215,
        commentCount: 54,
        authorName: "devops_fan",
        publishedAt: new Date(Date.now() - 7_200_000).toISOString(),
      },
    ];

    // ---------------------------------------------------------------------------
    // Reddit — posts from r/ClaudeAI, r/MachineLearning, r/programming
    // ---------------------------------------------------------------------------
    // Real implementation would call:
    //   GET https://www.reddit.com/r/ClaudeAI/hot.json?limit=25
    //   GET https://www.reddit.com/r/MachineLearning/hot.json?limit=10

    const redditItems: TrendingItem[] = [
      {
        source: "reddit",
        externalId: "reddit-abc123",
        title: "How I use CLAUDE.md to 10x my productivity",
        url: "https://reddit.com/r/ClaudeAI/comments/abc123",
        description: "A deep dive into custom instructions and workflow automation",
        score: 1840,
        commentCount: 203,
        authorName: "claude_power_user",
        publishedAt: new Date(Date.now() - 14_400_000).toISOString(),
      },
    ];

    // ---------------------------------------------------------------------------
    // GitHub — trending repositories tagged with claude, claude-code, llm
    // ---------------------------------------------------------------------------
    // Real implementation would call:
    //   GET https://api.github.com/search/repositories
    //     ?q=topic:claude+topic:ai+created:>2025-01-01
    //     &sort=stars&order=desc

    const githubItems: TrendingItem[] = [
      {
        source: "github",
        externalId: "github-repo-owner-claude-toolkit",
        title: "owner/claude-toolkit — A collection of Claude Code skills",
        url: "https://github.com/owner/claude-toolkit",
        description: "Pre-built skills for common development workflows",
        score: 2100,
        commentCount: 0,
        authorName: "owner",
        publishedAt: new Date(Date.now() - 86_400_000).toISOString(),
      },
      {
        source: "github",
        externalId: "github-repo-owner2-ai-guide-helper",
        title: "owner2/ai-guide-helper — CLI tool for ai-guide platform",
        url: "https://github.com/owner2/ai-guide-helper",
        description: "Command-line interface for managing your skill library",
        score: 890,
        commentCount: 0,
        authorName: "owner2",
        publishedAt: new Date(Date.now() - 172_800_000).toISOString(),
      },
    ];

    const result: FetchResult = {
      fetched: hackerNewsItems.length + redditItems.length + githubItems.length,
      sources: {
        hackernews: hackerNewsItems,
        reddit: redditItems,
        github: githubItems,
      },
      fetchedAt: new Date().toISOString(),
    };

    // TODO: Upsert items into the `trending_items` table using Drizzle:
    //   import { db } from "@/lib/db/client";
    //   import { trendingItems } from "@/lib/db/schema";
    //   await db.insert(trendingItems).values([...]).onConflictDoUpdate({ ... });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
