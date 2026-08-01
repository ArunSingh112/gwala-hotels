"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

interface BranchOption {
  slug: string;
  name: string;
}

function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date()
  );
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function SearchWidgetInner({ branches }: { branches: BranchOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const today = todayIso();

  const [hotel, setHotel] = useState(params.get("hotel") ?? "");
  const [checkIn, setCheckIn] = useState(params.get("checkIn") ?? today);
  const [checkOut, setCheckOut] = useState(
    params.get("checkOut") ?? addDays(today, 1)
  );
  const [adults, setAdults] = useState(Number(params.get("adults") ?? 2));
  const [children, setChildren] = useState(Number(params.get("children") ?? 0));
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (checkOut <= checkIn) {
      setError("Check-out must be after check-in.");
      return;
    }
    setError(null);
    const q = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
    });
    if (hotel) q.set("hotel", hotel);
    router.push(`/booking?${q.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-label="Search for rooms"
      className="rounded-2xl border border-cream-200 bg-white p-4 shadow-lg sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <label htmlFor="sw-branch" className="field-label">
            Branch
          </label>
          <select
            id="sw-branch"
            value={hotel}
            onChange={(e) => setHotel(e.target.value)}
            className="field-input"
          >
            <option value="">Any branch</option>
            {branches.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sw-checkin" className="field-label">
            Check-in
          </label>
          <input
            id="sw-checkin"
            type="date"
            required
            min={today}
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut <= e.target.value) {
                setCheckOut(addDays(e.target.value, 1));
              }
            }}
            className="field-input"
          />
        </div>

        <div>
          <label htmlFor="sw-checkout" className="field-label">
            Check-out
          </label>
          <input
            id="sw-checkout"
            type="date"
            required
            min={addDays(checkIn, 1)}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="field-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sw-adults" className="field-label">
              Adults
            </label>
            <select
              id="sw-adults"
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="field-input"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sw-children" className="field-label">
              Children
            </label>
            <select
              id="sw-children"
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="field-input"
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full">
            Check Rooms
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-maroon-700">
          {error}
        </p>
      )}
    </form>
  );
}

export function SearchWidget({ branches }: { branches: BranchOption[] }) {
  return (
    <Suspense fallback={null}>
      <SearchWidgetInner branches={branches} />
    </Suspense>
  );
}
