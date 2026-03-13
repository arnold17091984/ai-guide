"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createTeam } from "@/lib/teams/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Labels {
  teamName: string;
  description: string;
  publicTeam: string;
  publicTeamHint: string;
  privateTeam: string;
  privateTeamHint: string;
  creating: string;
  createTeam: string;
  cancel: string;
}

interface CreateTeamFormProps {
  locale: string;
  labels: Labels;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateTeamForm({ locale, labels }: CreateTeamFormProps) {
  const router = useRouter();
  const currentLocale = useLocale();
  const effectiveLocale = locale ?? currentLocale;

  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const team = await createTeam({
          name: name.trim(),
          description: description.trim() || undefined,
          isPublic,
        });
        router.push(`/${effectiveLocale}/teams/${team.slug}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create team");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Team Name */}
      <div>
        <label
          htmlFor="team-name"
          className="mb-1.5 block text-sm font-medium text-(--text-1)"
        >
          {labels.teamName}
        </label>
        <input
          id="team-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isPending}
          className="w-full rounded-xl border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="team-description"
          className="mb-1.5 block text-sm font-medium text-(--text-1)"
        >
          {labels.description}
        </label>
        <textarea
          id="team-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={isPending}
          className="w-full resize-none rounded-xl border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
        />
      </div>

      {/* Public / Private Toggle */}
      <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
        <div className="flex items-start gap-4">
          {/* Public option */}
          <label className="flex flex-1 cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="visibility"
              checked={isPublic}
              onChange={() => setIsPublic(true)}
              disabled={isPending}
              className="mt-0.5 h-4 w-4 accent-cyan-500"
            />
            <div>
              <p className="text-sm font-medium text-(--text-1)">
                {labels.publicTeam}
              </p>
              <p className="text-xs text-(--text-2)">{labels.publicTeamHint}</p>
            </div>
          </label>

          {/* Private option */}
          <label className="flex flex-1 cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="visibility"
              checked={!isPublic}
              onChange={() => setIsPublic(false)}
              disabled={isPending}
              className="mt-0.5 h-4 w-4 accent-cyan-500"
            />
            <div>
              <p className="text-sm font-medium text-(--text-1)">
                {labels.privateTeam}
              </p>
              <p className="text-xs text-(--text-2)">{labels.privateTeamHint}</p>
            </div>
          </label>
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-(--text-2) transition-colors hover:bg-(--surface-hover) disabled:opacity-50"
        >
          {labels.cancel}
        </button>
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {labels.creating}
            </>
          ) : (
            labels.createTeam
          )}
        </button>
      </div>
    </form>
  );
}
