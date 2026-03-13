"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { DURATION, EASE_APPLE } from "@/lib/motion";
import { updateTeam, deleteTeam } from "@/lib/teams/actions";
import PageHeader from "@/components/PageHeader";

interface TeamSettingsClientProps {
  locale: string;
  team: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    avatarUrl: string | null;
    isPublic: boolean;
    maxMembers: number;
    ownerId: string;
  };
  isOwner: boolean;
  labels: {
    settingsTitle: string;
    settingsSubtitle: string;
    teamName: string;
    teamDescription: string;
    avatarUrl: string;
    isPublic: string;
    maxMembers: string;
    save: string;
    saving: string;
    saved: string;
    dangerZone: string;
    deleteTeam: string;
    deleteWarning: string;
    confirmDelete: string;
    back: string;
  };
}

export default function TeamSettingsClient({
  locale,
  team,
  isOwner,
  labels,
}: TeamSettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? "");
  const [avatarUrl, setAvatarUrl] = useState(team.avatarUrl ?? "");
  const [isPublic, setIsPublic] = useState(team.isPublic);
  const [maxMembers, setMaxMembers] = useState(team.maxMembers);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);

    startTransition(async () => {
      try {
        await updateTeam(team.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
          isPublic,
          maxMembers,
        });
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } catch {
        // Error handling
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTeam(team.id);
        router.push(`/${locale}/teams`);
      } catch {
        // Error handling
      }
    });
  }

  return (
    <div className="min-h-screen bg-(--bg-base)">
      <PageHeader
        title={labels.settingsTitle}
        subtitle={labels.settingsSubtitle}
        gradient=""
      />

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href={`/${locale}/teams/${team.slug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-(--text-2) hover:text-(--text-1) transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {labels.back}
        </Link>

        <motion.form
          onSubmit={handleSave}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
          className="space-y-6 rounded-lg border border-(--border) bg-(--bg-surface) p-6"
        >
          {/* Team Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--text-1)">
              {labels.teamName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2.5 text-sm text-(--text-1) focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--text-1)">
              {labels.teamDescription}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2.5 text-sm text-(--text-1) focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20 resize-none"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--text-1)">
              {labels.avatarUrl}
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20"
            />
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-(--text-1)">
              {labels.isPublic}
            </span>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                isPublic ? "bg-(--accent)" : "bg-(--bg-elevated)"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Max Members */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--text-1)">
              {labels.maxMembers}
            </label>
            <input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              min={1}
              max={100}
              className="w-32 rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2.5 text-sm text-(--text-1) focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20"
            />
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-(--accent) px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-(--accent-hover) disabled:opacity-50"
            >
              {isPending ? labels.saving : saved ? labels.saved : labels.save}
            </button>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-emerald-500"
              >
                <svg className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </motion.span>
            )}
          </div>
        </motion.form>

        {/* Danger Zone */}
        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.normal, ease: EASE_APPLE, delay: 0.1 }}
            className="mt-8 rounded-lg border border-red-500/30 bg-red-500/5 p-6"
          >
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
              {labels.dangerZone}
            </h3>
            <p className="mt-1 text-sm text-red-600/70 dark:text-red-400/70">
              {labels.deleteWarning}
            </p>
            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="mt-4 rounded-md border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                {labels.deleteTeam}
              </button>
            ) : (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {labels.confirmDelete}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-md border border-(--border) px-4 py-2 text-sm font-medium text-(--text-2) hover:bg-(--bg-elevated) transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
