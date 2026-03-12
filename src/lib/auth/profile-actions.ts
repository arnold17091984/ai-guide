"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";
import { getCurrentUser } from "./get-current-user";

// ============================================================
// Profile update action
// ============================================================

const VALID_LOCALES = ["ko", "en", "ja"] as const;
type Locale = (typeof VALID_LOCALES)[number];

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateProfile(
  formData: FormData,
): Promise<UpdateProfileResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "unauthenticated" };
  }

  const displayName = (formData.get("displayName") as string | null)?.trim() ?? "";
  const bio = (formData.get("bio") as string | null)?.trim() ?? "";
  const locale = (formData.get("locale") as string | null)?.trim() ?? "";
  const websiteUrl = (formData.get("websiteUrl") as string | null)?.trim() ?? "";

  // Validate displayName
  if (displayName.length > 100) {
    return { success: false, error: "displayNameTooLong" };
  }

  // Validate bio
  if (bio.length > 500) {
    return { success: false, error: "bioTooLong" };
  }

  // Validate locale
  if (locale && !VALID_LOCALES.includes(locale as Locale)) {
    return { success: false, error: "invalidLocale" };
  }

  // Validate websiteUrl — allow empty, but reject invalid URLs
  if (websiteUrl && !isValidUrl(websiteUrl)) {
    return { success: false, error: "invalidWebsiteUrl" };
  }

  try {
    await db
      .update(users)
      .set({
        displayName: displayName || null,
        bio: bio || null,
        locale: (locale as Locale) || currentUser.locale,
        websiteUrl: websiteUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id));

    return { success: true };
  } catch {
    return { success: false, error: "serverError" };
  }
}
