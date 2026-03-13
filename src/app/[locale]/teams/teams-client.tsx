"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_APPLE, DURATION } from "@/lib/motion";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import TeamCard from "@/components/TeamCard";
import { createTeam, joinPublicTeam } from "@/lib/teams/actions";
import type { Team } from "@/lib/db/schema/teams";

// ============================================================
// Types
// ============================================================

interface MyTeam extends Team {
  memberRole: string;
}

interface PublicTeam extends Team {
  memberCount: number;
}

interface Labels {
  myTeams: string;
  discover: string;
  createTeam: string;
  searchPlaceholder: string;
  noTeams: string;
  noPublicTeams: string;
  loginToCreate: string;
  teamName: string;
  teamDescription: string;
  isPublic: string;
  cancel: string;
  create: string;
  creating: string;
}

interface TeamsPageClientProps {
  locale: string;
  activeTab: string;
  myTeams: MyTeam[];
  publicTeams: PublicTeam[];
  myTeamIds: string[];
  isLoggedIn: boolean;
  searchQuery: string;
  labels: Labels;
}

// ============================================================
// Icons
// ============================================================

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function MyTeamsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-4.5 0 2.625 2.625 0 014.5 0z" />
    </svg>
  );
}

function DiscoverIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

// ============================================================
// Component
// ============================================================

export default function TeamsPageClient({
  locale,
  activeTab,
  myTeams,
  publicTeams,
  myTeamIds,
  isLoggedIn,
  searchQuery,
  labels,
}: TeamsPageClientProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery);

  // Create team form state
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [teamPublic, setTeamPublic] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/${locale}/teams?tab=discover&q=${encodeURIComponent(search)}`);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreateError(null);

    startTransition(async () => {
      try {
        const team = await createTeam({
          name: teamName.trim(),
          description: teamDesc.trim() || undefined,
          isPublic: teamPublic,
        });
        setShowCreateModal(false);
        setTeamName("");
        setTeamDesc("");
        router.push(`/${locale}/teams/${team.slug}`);
        router.refresh();
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : "Failed to create team");
      }
    });
  }

  function handleJoin(teamId: string) {
    startTransition(async () => {
      try {
        await joinPublicTeam(teamId);
        router.refresh();
      } catch {
        // silently fail for now
      }
    });
  }

  const joinedIds = new Set(myTeamIds);

  const tabs = [
    { key: "my", label: labels.myTeams, icon: <MyTeamsIcon /> },
    { key: "discover", label: labels.discover, icon: <DiscoverIcon /> },
  ];

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto rounded-md border border-(--border) bg-(--bg-surface) p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/${locale}/teams${tab.key === "my" ? "" : "?tab=discover"}`}
                className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-(--accent-muted) text-(--accent) font-medium"
                    : "text-(--text-2) hover:text-(--text-1) hover:bg-(--bg-elevated)"
                }`}
              >
                {tab.icon}
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Create button */}
        {isLoggedIn ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-md bg-(--accent) px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-(--accent-hover)"
          >
            <PlusIcon />
            {labels.createTeam}
          </button>
        ) : (
          <span className="text-sm text-(--text-2)">{labels.loginToCreate}</span>
        )}
      </div>

      {/* Search (discover tab) */}
      {activeTab === "discover" && (
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-(--text-2)">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full rounded-md border border-(--border) bg-(--bg-surface) py-3 pl-11 pr-4 text-sm text-(--text-1) placeholder:text-(--text-2) focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20"
            />
          </div>
        </form>
      )}

      {/* Content */}
      {activeTab === "my" ? (
        myTeams.length === 0 ? (
          <ScrollFadeIn>
            <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-12 text-center">
              <p className="text-(--text-2)">{labels.noTeams}</p>
            </div>
          </ScrollFadeIn>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myTeams.map((team, i) => (
              <ScrollFadeIn key={team.id} delay={i * 0.05}>
                <TeamCard
                  name={team.name}
                  slug={team.slug}
                  description={team.description}
                  avatarUrl={team.avatarUrl}
                  memberCount={0}
                  isPublic={team.isPublic}
                  isJoined
                />
              </ScrollFadeIn>
            ))}
          </div>
        )
      ) : publicTeams.length === 0 ? (
        <ScrollFadeIn>
          <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-12 text-center">
            <p className="text-(--text-2)">{labels.noPublicTeams}</p>
          </div>
        </ScrollFadeIn>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publicTeams.map((team, i) => (
            <ScrollFadeIn key={team.id} delay={i * 0.05}>
              <TeamCard
                name={team.name}
                slug={team.slug}
                description={team.description}
                avatarUrl={team.avatarUrl}
                memberCount={team.memberCount}
                isPublic={team.isPublic}
                isJoined={joinedIds.has(team.id)}
                onJoin={() => handleJoin(team.id)}
              />
            </ScrollFadeIn>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.normal }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: DURATION.normal, ease: EASE_APPLE }}
              className="fixed inset-x-4 top-[15%] z-50 mx-auto max-w-md rounded-lg border border-(--border) bg-(--bg-surface) p-6 shadow-lg sm:inset-x-auto"
            >
              <h3 className="mb-5 text-lg font-semibold text-(--text-1)">
                {labels.createTeam}
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-(--text-1)">
                    {labels.teamName}
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2.5 text-sm text-(--text-1) focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20"
                    required
                    disabled={isPending}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-(--text-1)">
                    {labels.teamDescription}
                  </label>
                  <textarea
                    value={teamDesc}
                    onChange={(e) => setTeamDesc(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-(--border) bg-(--bg-surface) px-4 py-2.5 text-sm text-(--text-1) focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/20 resize-none"
                    disabled={isPending}
                  />
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={teamPublic}
                    onChange={(e) => setTeamPublic(e.target.checked)}
                    className="h-4 w-4 rounded border-(--border) accent-(--accent)"
                    disabled={isPending}
                  />
                  <span className="text-sm text-(--text-1)">{labels.isPublic}</span>
                </label>

                {createError && (
                  <p className="text-sm text-red-500">{createError}</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-md border border-(--border) px-4 py-2.5 text-sm font-medium text-(--text-2) hover:bg-(--bg-elevated) transition-colors"
                    disabled={isPending}
                  >
                    {labels.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !teamName.trim()}
                    className="rounded-md bg-(--accent) px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-(--accent-hover) disabled:opacity-50"
                  >
                    {isPending ? labels.creating : labels.create}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
