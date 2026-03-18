import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  learningPaths,
  learningPathSteps,
  userLearningProgress,
  users,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// ============================================================
// Types
// ============================================================

export type ListLearningPathsOptions = {
  targetRole?: string;
  difficultyLevel?: string;
  page?: number;
  pageSize?: number;
};

export type LearningPathSummary = {
  id: string;
  titleKo: string;
  titleEn: string | null;
  titleJa: string | null;
  descriptionKo: string | null;
  descriptionEn: string | null;
  descriptionJa: string | null;
  targetRole: string | null;
  difficultyLevel: string | null;
  estimatedHours: number | null;
  isOfficial: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
};

export type LearningPathStep = {
  id: string;
  pathId: string;
  stepNumber: number;
  contentType: string;
  contentId: string;
  isRequired: boolean;
  notesKo: string | null;
  notesEn: string | null;
  notesJa: string | null;
};

export type LearningPathDetail = LearningPathSummary & {
  title: string;
  description: string | null;
  steps: LearningPathStep[];
};

// ============================================================
// listLearningPaths — paginated list with optional filters
// ============================================================

export async function listLearningPaths(options: ListLearningPathsOptions = {}) {
  const { targetRole, difficultyLevel, page = 1, pageSize = 20 } = options;
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const offset = (safePage - 1) * safePageSize;

  try {
    const conditions = [eq(learningPaths.status, "published")];
    if (targetRole) {
      conditions.push(eq(learningPaths.targetRole, targetRole));
    }
    if (difficultyLevel) {
      conditions.push(eq(learningPaths.difficultyLevel, difficultyLevel));
    }

    const where = and(...conditions);

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: learningPaths.id,
          titleKo: learningPaths.titleKo,
          titleEn: learningPaths.titleEn,
          titleJa: learningPaths.titleJa,
          descriptionKo: learningPaths.descriptionKo,
          descriptionEn: learningPaths.descriptionEn,
          descriptionJa: learningPaths.descriptionJa,
          targetRole: learningPaths.targetRole,
          difficultyLevel: learningPaths.difficultyLevel,
          estimatedHours: learningPaths.estimatedHours,
          isOfficial: learningPaths.isOfficial,
          status: learningPaths.status,
          createdAt: learningPaths.createdAt,
          updatedAt: learningPaths.updatedAt,
          authorId: learningPaths.authorId,
          authorUsername: users.username,
          authorDisplayName: users.displayName,
          authorAvatarUrl: users.avatarUrl,
        })
        .from(learningPaths)
        .innerJoin(users, eq(learningPaths.authorId, users.id))
        .where(where)
        .orderBy(desc(learningPaths.isOfficial), desc(learningPaths.createdAt))
        .limit(safePageSize)
        .offset(offset),

      db
        .select({ value: count() })
        .from(learningPaths)
        .where(where),
    ]);

    return { items: rows, total: Number(totalRow?.value ?? 0) };
  } catch {
    return { items: [], total: 0 };
  }
}

// ============================================================
// getLearningPathById — single path with localized fields + steps
// ============================================================

export async function getLearningPathById(id: string, locale = "ko") {
  try {
    const rows = await db
      .select({
        id: learningPaths.id,
        titleKo: learningPaths.titleKo,
        titleEn: learningPaths.titleEn,
        titleJa: learningPaths.titleJa,
        descriptionKo: learningPaths.descriptionKo,
        descriptionEn: learningPaths.descriptionEn,
        descriptionJa: learningPaths.descriptionJa,
        targetRole: learningPaths.targetRole,
        difficultyLevel: learningPaths.difficultyLevel,
        estimatedHours: learningPaths.estimatedHours,
        isOfficial: learningPaths.isOfficial,
        status: learningPaths.status,
        createdAt: learningPaths.createdAt,
        updatedAt: learningPaths.updatedAt,
        authorId: learningPaths.authorId,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(learningPaths)
      .innerJoin(users, eq(learningPaths.authorId, users.id))
      .where(eq(learningPaths.id, id))
      .limit(1);

    const path = rows[0] ?? null;
    if (!path) return null;

    const steps = await db
      .select({
        id: learningPathSteps.id,
        pathId: learningPathSteps.pathId,
        stepNumber: learningPathSteps.stepNumber,
        contentType: learningPathSteps.contentType,
        contentId: learningPathSteps.contentId,
        isRequired: learningPathSteps.isRequired,
        notesKo: learningPathSteps.notesKo,
        notesEn: learningPathSteps.notesEn,
        notesJa: learningPathSteps.notesJa,
      })
      .from(learningPathSteps)
      .where(eq(learningPathSteps.pathId, id))
      .orderBy(asc(learningPathSteps.stepNumber));

    // Resolve localized title and description
    const title =
      (locale === "en" ? path.titleEn : locale === "ja" ? path.titleJa : null) ??
      path.titleKo;

    const description =
      (locale === "en"
        ? path.descriptionEn
        : locale === "ja"
          ? path.descriptionJa
          : null) ?? path.descriptionKo;

    return { ...path, title, description, steps };
  } catch {
    return null;
  }
}

// ============================================================
// getUserPathProgress — all progress rows for user + path
// ============================================================

export async function getUserPathProgress(userId: string, pathId: string) {
  try {
    const rows = await db
      .select({
        id: userLearningProgress.id,
        userId: userLearningProgress.userId,
        pathId: userLearningProgress.pathId,
        stepId: userLearningProgress.stepId,
        status: userLearningProgress.status,
        startedAt: userLearningProgress.startedAt,
        completedAt: userLearningProgress.completedAt,
        timeSpentSecs: userLearningProgress.timeSpentSecs,
      })
      .from(userLearningProgress)
      .where(
        and(
          eq(userLearningProgress.userId, userId),
          eq(userLearningProgress.pathId, pathId),
        ),
      );

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// getMyEnrolledPaths — current user's paths with completion %
// ============================================================

export async function getMyEnrolledPaths() {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    // Get distinct path IDs the user has progress records for
    const progressRows = await db
      .select({
        pathId: userLearningProgress.pathId,
        stepId: userLearningProgress.stepId,
        status: userLearningProgress.status,
      })
      .from(userLearningProgress)
      .where(eq(userLearningProgress.userId, user.id));

    if (progressRows.length === 0) return [];

    const pathIds = [...new Set(progressRows.map((r) => r.pathId))];

    // Fetch path details with author info
    const paths = await db
      .select({
        id: learningPaths.id,
        titleKo: learningPaths.titleKo,
        titleEn: learningPaths.titleEn,
        titleJa: learningPaths.titleJa,
        targetRole: learningPaths.targetRole,
        difficultyLevel: learningPaths.difficultyLevel,
        estimatedHours: learningPaths.estimatedHours,
        isOfficial: learningPaths.isOfficial,
        status: learningPaths.status,
        createdAt: learningPaths.createdAt,
        updatedAt: learningPaths.updatedAt,
        authorId: learningPaths.authorId,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(learningPaths)
      .innerJoin(users, eq(learningPaths.authorId, users.id))
      .where(inArray(learningPaths.id, pathIds));

    // Compute completion percentage per path
    return paths.map((path) => {
      const pathProgress = progressRows.filter((r) => r.pathId === path.id);
      const total = pathProgress.length;
      const completed = pathProgress.filter((r) => r.status === "completed").length;
      const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { ...path, completionPercent, totalSteps: total, completedSteps: completed };
    });
  } catch {
    return [];
  }
}
