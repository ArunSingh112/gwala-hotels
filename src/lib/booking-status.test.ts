import { describe, expect, it } from "vitest";
import {
  canTransition,
  transitionReleasesRooms,
  isTerminalStatus,
} from "./booking-status";

describe("canTransition", () => {
  // The permitted transitions, exactly as in the spec's status table.
  const allowed: [string, string][] = [
    ["pending", "confirmed"],
    ["pending", "cancelled"],
    ["confirmed", "checked_in"],
    ["confirmed", "cancelled"],
    ["confirmed", "no_show"],
    ["checked_in", "checked_out"],
  ];

  it.each(allowed)("allows %s -> %s", (from, to) => {
    expect(canTransition(from as never, to as never)).toBe(true);
  });

  const forbidden: [string, string][] = [
    ["pending", "checked_in"],
    ["pending", "checked_out"],
    ["pending", "no_show"],
    ["confirmed", "pending"],
    ["confirmed", "checked_out"],
    ["checked_in", "cancelled"],
    ["checked_in", "no_show"],
    ["checked_in", "pending"],
    ["checked_out", "cancelled"],
    ["cancelled", "confirmed"],
    ["cancelled", "pending"],
    ["no_show", "confirmed"],
    ["pending", "pending"],
  ];

  it.each(forbidden)("rejects %s -> %s", (from, to) => {
    expect(canTransition(from as never, to as never)).toBe(false);
  });
});

describe("transitionReleasesRooms", () => {
  it("releases on the three releasing transitions", () => {
    expect(transitionReleasesRooms("pending", "cancelled")).toBe(true);
    expect(transitionReleasesRooms("confirmed", "cancelled")).toBe(true);
    expect(transitionReleasesRooms("confirmed", "no_show")).toBe(true);
  });

  it("does not release on non-releasing transitions", () => {
    expect(transitionReleasesRooms("pending", "confirmed")).toBe(false);
    expect(transitionReleasesRooms("confirmed", "checked_in")).toBe(false);
    expect(transitionReleasesRooms("checked_in", "checked_out")).toBe(false);
  });
});

describe("isTerminalStatus", () => {
  it("marks checked_out, cancelled and no_show terminal", () => {
    expect(isTerminalStatus("checked_out")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
    expect(isTerminalStatus("no_show")).toBe(true);
  });

  it("marks the live statuses non-terminal", () => {
    expect(isTerminalStatus("pending")).toBe(false);
    expect(isTerminalStatus("confirmed")).toBe(false);
    expect(isTerminalStatus("checked_in")).toBe(false);
  });
});
