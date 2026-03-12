"use client";

import { signInWithGitHub, signOut as serverSignOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Client-side hook that exposes the current auth user and actions.
 *
 * - Fetches the initial user on mount via getUser() (validates against Supabase,
 *   not just the local JWT).
 * - Subscribes to onAuthStateChange so the UI reacts to sign-in/sign-out events
 *   that happen in other tabs or after the OAuth redirect.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Validate session against Supabase server to avoid stale JWTs
    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: User | null } }) => setUser(data.user))
      .finally(() => setLoading(false));

    // Keep state in sync across tabs / after OAuth redirects
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    signIn: signInWithGitHub,
    signOut: serverSignOut,
  };
}
