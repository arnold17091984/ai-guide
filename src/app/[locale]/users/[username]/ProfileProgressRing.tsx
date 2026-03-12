"use client";

import ProgressRing from "@/components/ProgressRing";

// ============================================================
// Thin client wrapper so the profile page stays a server component
// ============================================================

interface ProfileProgressRingProps {
  reputation: number;
}

export default function ProfileProgressRing({
  reputation,
}: ProfileProgressRingProps) {
  return <ProgressRing reputation={reputation} size={120} />;
}
