"use client";

import { useTransition, useState } from "react";
import { followUser, unfollowUser } from "@/lib/social/follow-actions";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
}: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovered, setIsHovered] = useState(false);

  function handleClick() {
    // Optimistic update
    const nextState = !isFollowing;
    setIsFollowing(nextState);

    startTransition(async () => {
      const result = nextState
        ? await followUser(targetUserId)
        : await unfollowUser(targetUserId);

      // Roll back on failure
      if (!result.success) {
        setIsFollowing(!nextState);
      }
    });
  }

  if (isFollowing) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={isPending}
        aria-label={isHovered ? "Unfollow" : "Following"}
        className={[
          "inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-150 disabled:opacity-50",
          isHovered
            ? "border-red-500/40 bg-red-500/10 text-red-400"
            : "border-(--accent)/40 bg-(--accent-muted) text-(--accent)",
        ].join(" ")}
      >
        {isHovered ? "Unfollow" : "Following"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label="Follow"
      className="inline-flex items-center rounded-md border border-(--border) px-3 py-1.5 text-sm font-medium text-(--text-1) transition-all duration-150 hover:border-(--accent) disabled:opacity-50"
    >
      Follow
    </button>
  );
}
