"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/components/admin/auth-context";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/rooms", label: "Rooms & Pricing" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/settings", label: "Branch Settings" },
  { href: "/admin/users", label: "Users", ownerOnly: true },
];

function LoginScreen() {
  const { signIn } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      // onIdTokenChanged in the provider takes over from here.
    } catch {
      setError("Sign-in failed. Check your email and password.");
      setBusy(false);
    }
  }

  return (
    <main className="jali grid min-h-screen place-items-center bg-cream-100 px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4 p-8">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-maroon-900 font-display text-2xl font-bold text-marigold-400">
            G
          </span>
          <h1 className="mt-3 font-display text-2xl font-semibold text-maroon-950">
            Gwala Hotels Admin
          </h1>
          <p className="mt-1 text-sm text-maroon-700">
            Sign in to manage bookings
          </p>
        </div>
        <div>
          <label htmlFor="li-email" className="field-label">
            Email
          </label>
          <input
            id="li-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="li-password" className="field-label">
            Password
          </label>
          <input
            id="li-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm font-semibold text-maroon-700">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { status, profile, signOutAdmin } = useAdminAuth();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-cream-100">
        <p role="status" className="text-maroon-800">
          Loading…
        </p>
      </main>
    );
  }

  if (status === "signed-out" || !profile) {
    return <LoginScreen />;
  }

  const nav = NAV.filter((item) => !item.ownerOnly || profile.role === "owner");

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="border-b border-cream-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-maroon-900 font-display font-bold text-marigold-400">
              G
            </span>
            <span className="font-display font-semibold text-maroon-900">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-maroon-800 sm:block">
              {profile.name}
              <span className="ml-1 rounded bg-cream-100 px-2 py-0.5 text-xs font-bold uppercase text-maroon-700">
                {profile.role === "owner" ? "Owner" : `Manager · ${profile.hotelId}`}
              </span>
            </span>
            <button
              type="button"
              onClick={() => void signOutAdmin()}
              className="font-semibold text-maroon-700 underline underline-offset-4 hover:text-maroon-900"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav
          aria-label="Admin"
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2"
        >
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-maroon-900 text-cream-50"
                    : "text-maroon-800 hover:bg-cream-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

export function AdminChrome({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
