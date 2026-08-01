import type { BookingStatus } from "./types";

// The status lifecycle, exactly as specified. Any transition not in this map
// is rejected by the server with a message naming the current status.
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["checked_out"],
  checked_out: [],
  cancelled: [],
  no_show: [],
};

// Only these transitions give rooms back to inventory. Rooms are reserved at
// creation, so confirming changes nothing; releasing happens exactly when a
// stay will no longer occupy its nights.
const RELEASING: [BookingStatus, BookingStatus][] = [
  ["pending", "cancelled"],
  ["confirmed", "cancelled"],
  ["confirmed", "no_show"],
];

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionReleasesRooms(
  from: BookingStatus,
  to: BookingStatus
): boolean {
  return RELEASING.some(([f, t]) => f === from && t === to);
}

export function isTerminalStatus(status: BookingStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
