"use client";

import { useTransition, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfile } from "@/lib/auth/profile-actions";
import { fadeUp, DURATION, EASE_APPLE } from "@/lib/motion";
import type { CurrentUser } from "@/lib/auth/get-current-user";

// ============================================================
// Types
// ============================================================

interface ProfileEditFormProps {
  user: CurrentUser;
  bio: string | null;
  websiteUrl: string | null;
  onClose: () => void;
}

// ============================================================
// Toast sub-component
// ============================================================

interface ToastProps {
  message: string;
  type: "success" | "error";
}

function Toast({ message, type }: ToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
        type === "success"
          ? "border-green-300/50 bg-green-50 text-green-800 dark:border-green-700/50 dark:bg-green-900/30 dark:text-green-300"
          : "border-red-300/50 bg-red-50 text-red-800 dark:border-red-700/50 dark:bg-red-900/30 dark:text-red-300"
      }`}
    >
      {type === "success" ? (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
        </svg>
      )}
      {message}
    </motion.div>
  );
}

// ============================================================
// ProfileEditForm
// ============================================================

const LOCALES = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
] as const;

export default function ProfileEditForm({
  user,
  bio,
  websiteUrl,
  onClose,
}: ProfileEditFormProps) {
  const t = useTranslations("profile");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastProps | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await updateProfile(formData);
        if (result.success) {
          showToast(t("editSuccess"), "success");
          setTimeout(onClose, 1500);
        } else {
          const errorKey = result.error ?? "serverError";
          const errorMap: Record<string, string> = {
            unauthenticated: t("errors.unauthenticated"),
            displayNameTooLong: t("errors.displayNameTooLong"),
            bioTooLong: t("errors.bioTooLong"),
            invalidLocale: t("errors.invalidLocale"),
            invalidWebsiteUrl: t("errors.invalidWebsiteUrl"),
            serverError: t("errors.serverError"),
          };
          showToast(errorMap[errorKey] ?? t("errors.serverError"), "error");
        }
      } catch {
        showToast(t("errors.serverError"), "error");
      }
    });
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-2xl border border-(--border) bg-white/70 p-6 shadow-md backdrop-blur-xl dark:bg-white/5"
    >
      {/* Glass shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-blue-500/5 via-cyan-500/3 to-teal-500/5" />

      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-(--text-1)">
            {t("editProfile")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-(--text-2) transition-colors hover:bg-(--surface-hover) hover:text-(--text-1)"
            aria-label={t("cancel")}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toast */}
        <div className="mb-4">
          <AnimatePresence>
            {toast && <Toast message={toast.message} type={toast.type} />}
          </AnimatePresence>
        </div>

        <form ref={formRef} action={handleSubmit} className="space-y-5">
          {/* Display name */}
          <div>
            <label
              htmlFor="displayName"
              className="mb-1.5 block text-sm font-medium text-(--text-1)"
            >
              {t("fields.displayName")}
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              defaultValue={user.displayName ?? ""}
              maxLength={100}
              placeholder={user.username}
              className="w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) outline-none transition-all focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 dark:focus:border-cyan-500/60 dark:focus:ring-cyan-500/20"
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="mb-1.5 block text-sm font-medium text-(--text-1)"
            >
              {t("fields.bio")}
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={bio ?? ""}
              maxLength={500}
              placeholder={t("fields.bioPlaceholder")}
              className="w-full resize-none rounded-xl border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) outline-none transition-all focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 dark:focus:border-cyan-500/60 dark:focus:ring-cyan-500/20"
            />
          </div>

          {/* Locale selector */}
          <div>
            <label
              htmlFor="locale"
              className="mb-1.5 block text-sm font-medium text-(--text-1)"
            >
              {t("fields.language")}
            </label>
            <select
              id="locale"
              name="locale"
              defaultValue={user.locale}
              className="w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--text-1) outline-none transition-all focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 dark:focus:border-cyan-500/60 dark:focus:ring-cyan-500/20"
            >
              {LOCALES.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Website URL */}
          <div>
            <label
              htmlFor="websiteUrl"
              className="mb-1.5 block text-sm font-medium text-(--text-1)"
            >
              {t("fields.websiteUrl")}
            </label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              defaultValue={websiteUrl ?? ""}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) outline-none transition-all focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 dark:focus:border-cyan-500/60 dark:focus:ring-cyan-500/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {t("saving")}
                </>
              ) : (
                t("saveChanges")
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-(--border) bg-(--surface) px-5 py-2.5 text-sm font-medium text-(--text-2) transition-all hover:bg-(--surface-hover) hover:text-(--text-1)"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
