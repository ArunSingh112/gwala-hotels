"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/auth-context";

interface RoomTypeRow {
  id: string;
  name: string;
  description: string;
  pricePerNight: number;
  maxAdults: number;
  maxChildren: number;
  totalRooms: number;
  amenities: string[];
  active: boolean;
  sortOrder: number;
  isSeedData?: boolean;
}

interface BranchOption {
  slug: string;
  name: string;
}

interface FormState {
  name: string;
  description: string;
  pricePerNight: string;
  maxAdults: string;
  maxChildren: string;
  totalRooms: string;
  amenities: string; // comma separated in the form
  active: boolean;
  sortOrder: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  pricePerNight: "",
  maxAdults: "2",
  maxChildren: "1",
  totalRooms: "1",
  amenities: "",
  active: true,
  sortOrder: "1",
};

function toPayload(form: FormState) {
  return {
    name: form.name,
    description: form.description,
    pricePerNight: Number(form.pricePerNight),
    maxAdults: Number(form.maxAdults),
    maxChildren: Number(form.maxChildren),
    totalRooms: Number(form.totalRooms),
    amenities: form.amenities
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean),
    active: form.active,
    sortOrder: Number(form.sortOrder),
  };
}

export function RoomsScreen() {
  const { authedFetch, profile } = useAdminAuth();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [hotelId, setHotelId] = useState(profile?.hotelId ?? "");
  const [rows, setRows] = useState<RoomTypeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void authedFetch("/api/admin/hotels")
      .then((r) => r.json())
      .then((body) => {
        const hs = (body.hotels ?? []).map(
          (h: { slug: string; name: string }) => ({ slug: h.slug, name: h.name })
        );
        setBranches(hs);
        setHotelId((prev) => prev || hs[0]?.slug || "");
      })
      .catch(() => {});
  }, [authedFetch]);

  const load = useCallback(async () => {
    if (!hotelId) return;
    setRows(null);
    setError(null);
    try {
      const res = await authedFetch(
        `/api/admin/room-types?hotelId=${encodeURIComponent(hotelId)}`
      );
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to load room types.");
        return;
      }
      setRows(body.roomTypes as RoomTypeRow[]);
    } catch {
      setError("Failed to load room types. Check your connection.");
    }
  }, [authedFetch, hotelId]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(row: RoomTypeRow) {
    setEditing(row.id);
    setFormError(null);
    setForm({
      name: row.name,
      description: row.description,
      pricePerNight: String(row.pricePerNight),
      maxAdults: String(row.maxAdults),
      maxChildren: String(row.maxChildren),
      totalRooms: String(row.totalRooms),
      amenities: row.amenities.join(", "),
      active: row.active,
      sortOrder: String(row.sortOrder),
    });
  }

  function startNew() {
    setEditing("new");
    setFormError(null);
    setForm({ ...EMPTY_FORM, sortOrder: String((rows?.length ?? 0) + 1) });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = { ...toPayload(form), hotelId };
      const res =
        editing === "new"
          ? await authedFetch("/api/admin/room-types", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await authedFetch(`/api/admin/room-types/${editing}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      const body = await res.json();
      if (!res.ok) {
        setFormError(body.error?.message ?? "Save failed.");
        return;
      }
      setEditing(null);
      await load();
    } catch {
      setFormError("Network error — nothing was saved.");
    } finally {
      setSaving(false);
    }
  }

  const anySeed = (rows ?? []).some((r) => r.isSeedData);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-maroon-950">
          Rooms &amp; pricing
        </h1>
        <div className="flex items-center gap-3">
          {profile?.role === "owner" && (
            <select
              aria-label="Branch"
              value={hotelId}
              onChange={(e) => {
                setHotelId(e.target.value);
                setEditing(null);
              }}
              className="field-input !w-auto"
            >
              {branches.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={startNew} className="btn-primary !min-h-10 !px-4 !py-2 text-sm">
            + Add room type
          </button>
        </div>
      </div>

      {anySeed && (
        <p className="rounded-xl border-2 border-dashed border-marigold-500 bg-marigold-50 p-4 font-semibold text-maroon-900">
          ⚠ Some room types below still carry sample rates. Edit and save each
          one with the branch&apos;s real prices and room counts.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-marigold-50 p-3 font-semibold text-maroon-900">
          {error}
        </p>
      )}

      {editing && (
        <form onSubmit={save} className="card space-y-4 border-marigold-300 p-6">
          <h2 className="font-display text-xl font-semibold text-maroon-900">
            {editing === "new" ? "New room type" : `Editing: ${form.name}`}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="rt-name" className="field-label">
                Name
              </label>
              <input
                id="rt-name"
                required
                minLength={2}
                maxLength={80}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="rt-price" className="field-label">
                Price per night (₹)
              </label>
              <input
                id="rt-price"
                required
                type="number"
                min={1}
                step={1}
                value={form.pricePerNight}
                onChange={(e) =>
                  setForm({ ...form, pricePerNight: e.target.value })
                }
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="rt-total" className="field-label">
                Total rooms
              </label>
              <input
                id="rt-total"
                required
                type="number"
                min={0}
                step={1}
                value={form.totalRooms}
                onChange={(e) => setForm({ ...form, totalRooms: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="rt-adults" className="field-label">
                Max adults / room
              </label>
              <input
                id="rt-adults"
                required
                type="number"
                min={1}
                step={1}
                value={form.maxAdults}
                onChange={(e) => setForm({ ...form, maxAdults: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="rt-children" className="field-label">
                Max children / room
              </label>
              <input
                id="rt-children"
                required
                type="number"
                min={0}
                step={1}
                value={form.maxChildren}
                onChange={(e) =>
                  setForm({ ...form, maxChildren: e.target.value })
                }
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="rt-sort" className="field-label">
                Sort order
              </label>
              <input
                id="rt-sort"
                required
                type="number"
                min={0}
                step={1}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                className="field-input"
              />
            </div>
          </div>
          <div>
            <label htmlFor="rt-desc" className="field-label">
              Description
            </label>
            <textarea
              id="rt-desc"
              rows={2}
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="rt-amenities" className="field-label">
              Amenities <span className="font-normal">(comma separated)</span>
            </label>
            <input
              id="rt-amenities"
              value={form.amenities}
              onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              placeholder="Air conditioning, Geyser, TV"
              className="field-input"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-maroon-900">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 accent-marigold-500"
            />
            Active — bookable on the website
          </label>

          {formError && (
            <p role="alert" className="rounded-lg bg-marigold-50 p-3 text-sm font-semibold text-maroon-900">
              {formError}
            </p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save room type"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!rows ? (
        <p role="status" className="py-8 text-center text-maroon-800">
          Loading room types…
        </p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-maroon-800">
          No room types yet — add the first one.
        </p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50 text-xs font-bold uppercase tracking-wide text-maroon-700">
                <th className="px-4 py-3">Room type</th>
                <th className="px-4 py-3">Price / night</th>
                <th className="px-4 py-3">Sleeps</th>
                <th className="px-4 py-3">Rooms</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-cream-100 hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-maroon-950">
                      {row.name}
                      {row.isSeedData && (
                        <span className="ml-2 rounded bg-marigold-100 px-2 py-0.5 text-xs font-bold text-maroon-900">
                          sample data
                        </span>
                      )}
                    </p>
                    <p className="line-clamp-1 text-maroon-700">
                      {row.description}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    ₹{row.pricePerNight.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    {row.maxAdults}A
                    {row.maxChildren > 0 && ` + ${row.maxChildren}C`}
                  </td>
                  <td className="px-4 py-3">{row.totalRooms}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        row.active
                          ? "bg-green-100 text-green-900"
                          : "bg-cream-200 text-maroon-700"
                      }`}
                    >
                      {row.active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="font-bold text-maroon-900 underline decoration-marigold-400 decoration-2 underline-offset-4"
                    >
                      Edit
                    </button>
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
