"use server";

import { eq, and, desc, count, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema/notifications";
import type { NewNotification } from "@/lib/db/schema/notifications";

// ============================================================
// createNotification
// ============================================================
export async function createNotification(
  params: Omit<NewNotification, "id" | "createdAt" | "isRead" | "readAt">,
) {
  const [row] = await db.insert(notifications).values(params).returning();
  return row;
}

// ============================================================
// getUserNotifications — paginated
// ============================================================
export async function getUserNotifications(
  userId: string,
  opts: { limit?: number; offset?: number; unreadOnly?: boolean } = {},
) {
  const { limit = 20, offset = 0, unreadOnly = false } = opts;

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return rows;
  } catch {
    return [];
  }
}

// ============================================================
// markAsRead
// ============================================================
export async function markAsRead(notificationId: string, userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: sql`now()` })
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
    );
}

// ============================================================
// markAllAsRead
// ============================================================
export async function markAllAsRead(userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: sql`now()` })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    );
}

// ============================================================
// getUnreadCount
// ============================================================
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const [result] = await db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    return result?.value ?? 0;
  } catch {
    return 0;
  }
}

// ============================================================
// deleteNotification
// ============================================================
export async function deleteNotification(
  notificationId: string,
  userId: string,
) {
  await db
    .delete(notifications)
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
    );
}
