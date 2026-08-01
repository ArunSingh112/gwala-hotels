"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth-context";

interface UserRow {
  uid: string;
  email: string;
  name: string;
  role: "owner" | "manager";
  hotelId: string | null;
  active: boolean;
}

interface BranchOption {
  slug: string;
  name: string;
}

export function UsersScreen() {
  const { authedFetch, profile } = useAdminAuth();
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New-manager form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hotelId, setHotelId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [usersRes, hotelsRes] = await Promise.all([
        authedFetch("/api/admin/users"),
        authedFetch("/api/admin/hotels"),
      ]);
      const usersBody = await usersRes.json();
      const hotelsBody = await hotelsRes.json();
      if (!usersRes.ok) {
        setError(usersBody.error?.message ?? "Failed to load users.");
        return;
      }
      setRows(usersBody.users as UserRow[]);
      const hs = (hotelsBody.hotels ?? []).map(
        (h: { slug: string; name: string }) => ({ slug: h.slug, name: h.name })
      );
      setBranches(hs);
      setHotelId((prev) => prev || hs[0]?.slug || "");
    } catch {
      setError("Failed to load users. Check your connection.");
    }
  }, [authedFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createManager(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await authedFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, hotelId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setFormError(body.error?.message ?? "Could not create the manager.");
        return;
      }
      setShowForm(false);
      setName("");
      setEmail("");
      setPassword("");
      await load();
    } catch {
      setFormError("Network error — the account was not created.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: UserRow) {
    const verb = row.active ? "Deactivate" : "Reactivate";
    if (!window.confirm(`${verb} ${row.name} (${row.email})?`)) return;
    setActing(row.uid);
    try {
      const res = await authedFetch(`/api/admin/users/${row.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      if (!res.ok) {
        const body = await res.json();
        window.alert(body.error?.message ?? "That didn't work.");
        return;
      }
      setRows((prev) =>
        (prev ?? []).map((r) =>
          r.uid === row.uid ? { ...r, active: !row.active } : r
        )
      );
    } catch {
      window.alert("Network error — nothing was changed.");
    } finally {
      setActing(null);
    }
  }

  const branchName = (slug: string | null) =>
    branches.find((b) => b.slug === slug)?.name ?? slug ?? "All branches";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-maroon-950">
          Users
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn-primary !min-h-10 !px-4 !py-2 text-sm"
        >
          {showForm ? "Close" : "+ Add manager"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createManager} className="card space-y-4 border-marigold-300 p-6">
          <h2 className="font-display text-xl font-semibold text-maroon-900">
            New branch manager
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="u-name" className="field-label">
                Name
              </label>
              <input
                id="u-name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="u-email" className="field-label">
                Email
              </label>
              <input
                id="u-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="u-password" className="field-label">
                Password <span className="font-normal">(min 8 characters)</span>
              </label>
              <input
                id="u-password"
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="u-branch" className="field-label">
                Branch
              </label>
              <select
                id="u-branch"
                required
                value={hotelId}
                onChange={(e) => setHotelId(e.target.value)}
                className="field-input"
              >
                {branches.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {formError && (
            <p role="alert" className="rounded-lg bg-marigold-50 p-3 text-sm font-semibold text-maroon-900">
              {formError}
            </p>
          )}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Creating…" : "Create manager"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-marigold-50 p-3 font-semibold text-maroon-900">
          {error}
        </p>
      )}

      {!rows ? (
        <p role="status" className="py-8 text-center text-maroon-800">
          Loading users…
        </p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50 text-xs font-bold uppercase tracking-wide text-maroon-700">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.uid} className="border-b border-cream-100 hover:bg-cream-50">
                  <td className="px-4 py-3 font-semibold text-maroon-950">
                    {row.name}
                    {row.uid === profile?.uid && (
                      <span className="ml-2 rounded bg-cream-100 px-2 py-0.5 text-xs font-bold text-maroon-700">
                        you
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3 capitalize">{row.role}</td>
                  <td className="px-4 py-3">
                    {row.role === "owner" ? "All branches" : branchName(row.hotelId)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        row.active
                          ? "bg-green-100 text-green-900"
                          : "bg-red-50 text-red-900"
                      }`}
                    >
                      {row.active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {/* The owner cannot deactivate their own account. */}
                    {row.uid !== profile?.uid && row.role !== "owner" && (
                      <button
                        type="button"
                        disabled={acting === row.uid}
                        onClick={() => void toggleActive(row)}
                        className="font-bold text-maroon-900 underline decoration-marigold-400 decoration-2 underline-offset-4 disabled:opacity-50"
                      >
                        {row.active ? "Deactivate" : "Reactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
