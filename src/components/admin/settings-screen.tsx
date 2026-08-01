"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth-context";
import { ATTRACTIONS } from "@/lib/attractions";

interface BranchSettings {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  address: string;
  mapsUrl: string;
  phone: string;
  displayPhone: string;
  email: string;
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  distances: Record<string, string>;
}

export function SettingsScreen() {
  const { authedFetch, profile } = useAdminAuth();
  const [branches, setBranches] = useState<BranchSettings[]>([]);
  const [hotelId, setHotelId] = useState(profile?.hotelId ?? "");
  const [form, setForm] = useState<BranchSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authedFetch("/api/admin/hotels");
      const body = await res.json();
      if (!res.ok) return;
      const hs = body.hotels as BranchSettings[];
      setBranches(hs);
      const selected = hotelId || hs[0]?.slug || "";
      setHotelId(selected);
      setForm(hs.find((h) => h.slug === selected) ?? null);
    } catch {
      setMessage({ tone: "err", text: "Failed to load branch settings." });
    }
  }, [authedFetch, hotelId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectBranch(slug: string) {
    setHotelId(slug);
    setForm(branches.find((h) => h.slug === slug) ?? null);
    setMessage(null);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await authedFetch(`/api/admin/hotels/${form.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: form.tagline,
          description: form.description,
          address: form.address,
          mapsUrl: form.mapsUrl,
          phone: form.phone,
          displayPhone: form.displayPhone,
          email: form.email,
          amenities: form.amenities,
          checkInTime: form.checkInTime,
          checkOutTime: form.checkOutTime,
          distances: form.distances,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage({ tone: "err", text: body.error?.message ?? "Save failed." });
        return;
      }
      setMessage({ tone: "ok", text: "Saved. The public site updates within a few minutes." });
    } catch {
      setMessage({ tone: "err", text: "Network error — nothing was saved." });
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <p role="status" className="py-8 text-center text-maroon-800">
        Loading branch settings…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-maroon-950">
          Branch settings
        </h1>
        {profile?.role === "owner" && (
          <select
            aria-label="Branch"
            value={hotelId}
            onChange={(e) => selectBranch(e.target.value)}
            className="field-input !w-auto"
          >
            {branches.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <form onSubmit={save} className="card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="st-tagline" className="field-label">
              Tagline
            </label>
            <input
              id="st-tagline"
              maxLength={120}
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="st-email" className="field-label">
              Email <span className="font-normal">(optional)</span>
            </label>
            <input
              id="st-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="field-input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="st-desc" className="field-label">
            Description
          </label>
          <textarea
            id="st-desc"
            rows={4}
            maxLength={2000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="field-input"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="st-address" className="field-label">
              Address
            </label>
            <textarea
              id="st-address"
              rows={2}
              maxLength={300}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="st-maps" className="field-label">
              Google Maps link
            </label>
            <input
              id="st-maps"
              type="url"
              value={form.mapsUrl}
              onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
              className="field-input"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="st-phone" className="field-label">
              WhatsApp number{" "}
              <span className="font-normal">(digits, e.g. 917060189819)</span>
            </label>
            <input
              id="st-phone"
              required
              pattern="\d{10,14}"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="st-display-phone" className="field-label">
              Display phone
            </label>
            <input
              id="st-display-phone"
              required
              maxLength={20}
              value={form.displayPhone}
              onChange={(e) =>
                setForm({ ...form, displayPhone: e.target.value })
              }
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="st-checkin" className="field-label">
              Check-in time
            </label>
            <input
              id="st-checkin"
              required
              type="time"
              value={form.checkInTime}
              onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="st-checkout" className="field-label">
              Check-out time
            </label>
            <input
              id="st-checkout"
              required
              type="time"
              value={form.checkOutTime}
              onChange={(e) =>
                setForm({ ...form, checkOutTime: e.target.value })
              }
              className="field-input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="st-amenities" className="field-label">
            Amenities <span className="font-normal">(comma separated)</span>
          </label>
          <input
            id="st-amenities"
            value={form.amenities.join(", ")}
            onChange={(e) =>
              setForm({
                ...form,
                amenities: e.target.value
                  .split(",")
                  .map((a) => a.trim())
                  .filter(Boolean),
              })
            }
            className="field-input"
          />
        </div>

        <fieldset>
          <legend className="field-label">
            Distances to attractions{" "}
            <span className="font-normal">
              (leave blank to show nothing — never guess)
            </span>
          </legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ATTRACTIONS.map((a) => (
              <div key={a.slug}>
                <label
                  htmlFor={`st-dist-${a.slug}`}
                  className="mb-1 block text-xs font-semibold text-maroon-800"
                >
                  {a.name}
                </label>
                <input
                  id={`st-dist-${a.slug}`}
                  placeholder="e.g. 5 min walk"
                  maxLength={60}
                  value={form.distances[a.slug] ?? ""}
                  onChange={(e) => {
                    const next = { ...form.distances };
                    if (e.target.value.trim()) {
                      next[a.slug] = e.target.value;
                    } else {
                      delete next[a.slug];
                    }
                    setForm({ ...form, distances: next });
                  }}
                  className="field-input !py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </fieldset>

        {message && (
          <p
            role={message.tone === "err" ? "alert" : "status"}
            className={`rounded-lg p-3 text-sm font-semibold ${
              message.tone === "ok"
                ? "bg-green-50 text-green-900"
                : "bg-marigold-50 text-maroon-900"
            }`}
          >
            {message.text}
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
