import { describe, expect, it } from "vitest";
import { generateBookingCode, BOOKING_CODE_PATTERN } from "./booking-code";

describe("generateBookingCode", () => {
  it("matches the GW-XXXXXX shape", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateBookingCode()).toMatch(BOOKING_CODE_PATTERN);
    }
  });

  it("is uppercase", () => {
    const code = generateBookingCode();
    expect(code).toBe(code.toUpperCase());
  });

  it("avoids ambiguous characters 0, O, 1, I, L", () => {
    for (let i = 0; i < 200; i++) {
      const suffix = generateBookingCode().slice(3);
      expect(suffix).not.toMatch(/[0O1IL]/);
    }
  });

  it("produces distinct codes across many draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateBookingCode());
    // Collisions are possible but wildly unlikely in 1000 draws from 31^6.
    expect(seen.size).toBeGreaterThan(990);
  });
});
