"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";
import ScrollFadeIn from "@/components/ScrollFadeIn";
import TeamMemberRow from "@/components/TeamMemberRow";
import InviteModal from "@/components/InviteModal";
import {
  removeMember,
  updateMemberRole,
  leaveTeam,
  joinPublicTeam,
} from "@/lib/teams/actions";

// ============================================================
// Types
// ============================================================

interface TeamData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  maxMembers: number;
  ownerId: string;
  createdAt: string;
}

interface MemberData {
  memberId: string;
  userId: string;
  role: string;
  joinedAt: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputation: number;
}

interface PendingInvite {
  id: string;
  email: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
}

interface Labels {
  members: string;
  settings: string;
  invite: string;
  joinTeam: string;
  leaveTeam: string;
  createdOn: string;
  memberCount: string;
  publicTeam: string;
  privateTeam: string;
  confirmLeave: string;
}

interface TeamDetailClientProps {
  locale: string;
  team: TeamData;
  members: MemberData[];
  memberCount: number;
  currentUserId: string | null;
  memberRole: string | null;
  pendingInvites: PendingInvite[];
  labels: Labels;
}

// ============================================================
// Component
// ============================================================

export default function TeamDetailClient({
  locale,
  team,
  members,
  memberCount,
  currentUserId,
  memberRole,
  pendingInvites,
  labels,
}: TeamDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const isOwner = memberRole === "owner";
  const isAdmin = memberRole === "admin";
  const canManage = isOwner || isAdmin;
  const isMember = !!memberRole;
  const initial = team.name.charAt(0).toUpperCase();

  function handleRemove(userId: string) {
    if (!confirm("Remove this member?")) return;
    startTransition(async () => {
      await removeMember(team.id, userId);
      router.refresh();
    });
  }

  function handleChangeRole(userId: string, role: "admin" | "member") {
    startTransition(async () => {
      await updateMemberRole(team.id, userId, role);
      router.refresh();
    });
  }

  function handleLeave() {
    if (!confirm(labels.confirmLeave)) return;
    startTransition(async () => {
      await leaveTeam(team.id);
      router.push(`/${locale}/teams`);
      router.refresh();
    });
  }

  function handleJoin() {
    startTransition(async () => {
      await joinPublicTeam(team.id);
      router.refresh();
    });
  }

  return (
    <>
      {/* Team Header */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative -mx-4 -mt-8 mb-10 overflow-hidden rounded-b-lg border-b border-(--border) bg-(--bg-surface) px-8 py-10 sm:-mx-6 lg:-mx-8"
      >
        <div className="relative">
          <motion.div variants={fadeUp} className="flex items-center gap-5">
            {team.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={team.avatarUrl}
                alt={team.name}
                className="h-16 w-16 rounded-lg object-cover ring-1 ring-(--border)"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-(--bg-elevated) text-2xl font-bold text-(--text-1) border border-(--border)">
                {initial}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-(--text-1) sm:text-3xl">
                {team.name}
              </h1>
              {team.description && (
                <p className="mt-1 max-w-xl text-(--text-2)">{team.description}</p>
              )}
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-5 flex flex-wrap items-center gap-4 text-sm text-(--text-2)"
          >
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-4.5 0 2.625 2.625 0 014.5 0z" />
              </svg>
              {memberCount} {labels.memberCount}
            </span>
            <span className="flex items-center gap-1.5">
              {team.isPublic ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
                  </svg>
                  {labels.publicTeam}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  {labels.privateTeam}
                </>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {labels.createdOn} {new Date(team.createdAt).toLocaleDateString(locale)}
            </span>
          </motion.div>

          {/* Action buttons */}
          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
            {canManage && (
              <>
                <Link
                  href={`/${locale}/teams/${team.slug}/settings`}
                  className="inline-flex items-center gap-2 rounded-md border border-(--border) px-4 py-2 text-sm font-medium text-(--text-1) transition-colors hover:bg-(--bg-elevated)"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {labels.settings}
                </Link>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-(--border) px-4 py-2 text-sm font-medium text-(--text-1) transition-colors hover:bg-(--bg-elevated)"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                  {labels.invite}
                </button>
              </>
            )}

            {!isMember && team.isPublic && currentUserId && (
              <button
                onClick={handleJoin}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-md bg-(--accent) px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-(--accent-hover) disabled:opacity-50"
              >
                {labels.joinTeam}
              </button>
            )}

            {isMember && !isOwner && (
              <button
                onClick={handleLeave}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-md border border-(--border) px-4 py-2 text-sm font-medium text-(--text-2) transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
              >
                {labels.leaveTeam}
              </button>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Members */}
      <ScrollFadeIn>
        <div className="rounded-lg border border-(--border) bg-(--bg-surface) p-6">
          <h2 className="mb-4 text-lg font-semibold text-(--text-1)">
            {labels.members} ({memberCount})
          </h2>
          <div className="divide-y divide-(--border)">
            {members.map((member) => (
              <TeamMemberRow
                key={member.memberId}
                userId={member.userId}
                username={member.username}
                displayName={member.displayName}
                avatarUrl={member.avatarUrl}
                role={member.role}
                reputation={member.reputation}
                canManage={canManage && member.userId !== currentUserId}
                isOwner={isOwner}
                onRemove={canManage ? handleRemove : undefined}
                onChangeRole={isOwner ? handleChangeRole : undefined}
              />
            ))}
          </div>
        </div>
      </ScrollFadeIn>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        teamId={team.id}
        pendingInvites={pendingInvites}
      />
    </>
  );
}
