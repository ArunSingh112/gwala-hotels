import { describe, expect, it } from "vitest";
import {
  expandNights,
  freeRooms,
  minFreeAcrossNights,
  calculateTotal,
  validateStayDates,
} from "./booking-math";

describe("expandNights", () => {
  it("covers check-in up to but not including check-out", () => {
    // A 14th–16th stay touches the 14th and 15th only (spec, availability).
    expect(expandNights("2026-08-14", "2026-08-16")).toEqual([
      "2026-08-14",
      "2026-08-15",
    ]);
  });

  it("handles a single night", () => {
    expect(expandNights("2026-08-14", "2026-08-15")).toEqual(["2026-08-14"]);
  });

  it("crosses month boundaries", () => {
    expect(expandNights("2026-08-30", "2026-09-02")).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
    ]);
  });

  it("crosses year boundaries", () => {
    expect(expandNights("2026-12-31", "2027-01-02")).toEqual([
      "2026-12-31",
      "2027-01-01",
    ]);
  });

  it("throws when check-out is not after check-in", () => {
    expect(() => expandNights("2026-08-14", "2026-08-14")).toThrow();
    expect(() => expandNights("2026-08-14", "2026-08-13")).toThrow();
  });
});

describe("freeRooms", () => {
  it("is totalRooms when nothing is booked", () => {
    expect(freeRooms(8, 0)).toBe(8);
  });

  it("subtracts booked rooms", () => {
    expect(freeRooms(8, 5)).toBe(3);
  });

  it("never goes below zero even if data is inconsistent", () => {
    expect(freeRooms(4, 9)).toBe(0);
  });
});

describe("minFreeAcrossNights", () => {
  it("returns the minimum free count across all nights", () => {
    // A room type is offerable only if free on ALL nights (spec, booking flow).
    expect(minFreeAcrossNights(8, [0, 5, 2])).toBe(3);
  });

  it("returns totalRooms when no nights have bookings", () => {
    expect(minFreeAcrossNights(6, [0, 0])).toBe(6);
  });

  it("returns zero when any night is full", () => {
    expect(minFreeAcrossNights(4, [1, 4, 0])).toBe(0);
  });
});

describe("calculateTotal", () => {
  it("is pricePerNight * rooms * nights", () => {
    expect(calculateTotal(1800, 2, 3)).toBe(10800);
  });

  it("handles one room, one night", () => {
    expect(calculateTotal(1200, 1, 1)).toBe(1200);
  });
});

describe("validateStayDates", () => {
  const today = "2026-08-01";

  it("accepts a normal future stay", () => {
    expect(validateStayDates("2026-08-14", "2026-08-16", today)).toEqual({
      ok: true,
    });
  });

  it("accepts check-in today", () => {
    expect(validateStayDates("2026-08-01", "2026-08-02", today)).toEqual({
      ok: true,
    });
  });

  it("rejects check-out on or before check-in", () => {
    expect(
      validateStayDates("2026-08-14", "2026-08-14", today).ok
    ).toBe(false);
    expect(
      validateStayDates("2026-08-14", "2026-08-13", today).ok
    ).toBe(false);
  });

  it("rejects dates in the past", () => {
    const result = validateStayDates("2026-07-30", "2026-08-02", today);
    expect(result.ok).toBe(false);
  });

  it("rejects check-in more than 12 months ahead", () => {
    const result = validateStayDates("2027-08-02", "2027-08-03", today);
    expect(result.ok).toBe(false);
  });

  it("accepts check-in exactly 12 months ahead", () => {
    expect(validateStayDates("2027-08-01", "2027-08-02", today).ok).toBe(true);
  });

  it("rejects malformed dates", () => {
    expect(validateStayDates("14-08-2026", "2026-08-16", today).ok).toBe(false);
    expect(validateStayDates("2026-08-14", "garbage", today).ok).toBe(false);
    expect(validateStayDates("2026-02-30", "2026-03-01", today).ok).toBe(false);
  });
});
