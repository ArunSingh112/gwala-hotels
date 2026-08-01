"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";

export interface AdminProfile {
  uid: string;
  email: string;
  name: string;
  role: "owner" | "manager";
  hotelId: string | null;
}

interface AdminAuthState {
  status: "loading" | "signed-out" | "signed-in";
  profile: AdminProfile | null;
  /** Fetch wrapper that attaches a fresh ID token to every admin API call. */
  authedFetch: (input: string, init?: RequestInit) => Promise<Response>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [status, setStatus] = useState<AdminAuthState["status"]>("loading");

  useEffect(() => {
    return onIdTokenChanged(clientAuth(), async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setStatus("signed-out");
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          // Authenticated with Firebase but not an active admin.
          await signOut(clientAuth());
          setProfile(null);
          setStatus("signed-out");
          return;
        }
        const body = await res.json();
        setProfile(body.profile as AdminProfile);
        setStatus("signed-in");
      } catch {
        setProfile(null);
        setStatus("signed-out");
      }
    });
  }, []);

  const authedFetch = useCallback(
    async (input: string, init?: RequestInit): Promise<Response> => {
      const user = firebaseUser ?? clientAuth().currentUser;
      if (!user) throw new Error("Not signed in");
      const token = await user.getIdToken();
      return fetch(input, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [firebaseUser]
  );

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(clientAuth(), email, password);
  }, []);

  const signOutAdmin = useCallback(async () => {
    await signOut(clientAuth());
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ status, profile, authedFetch, signIn, signOutAdmin }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
