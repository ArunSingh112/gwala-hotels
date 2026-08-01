import { describe, expect, it } from "vitest";
import { canActOnHotel } from "./roles";
import type { AdminUser } from "./types";

const owner: AdminUser = {
  email: "owner@example.com",
  name: "Owner",
  role: "owner",
  hotelId: null,
  active: true,
  createdAt: null,
};

const manager: AdminUser = {
  email: "manager@example.com",
  name: "Manager",
  role: "manager",
  hotelId: "gwala-inn",
  active: true,
  createdAt: null,
};

describe("canActOnHotel", () => {
  it("lets the owner act on any branch", () => {
    expect(canActOnHotel(owner, "gwala-inn")).toBe(true);
    expect(canActOnHotel(owner, "gwala-bhawan")).toBe(true);
  });

  it("lets a manager act on their own branch only", () => {
    expect(canActOnHotel(manager, "gwala-inn")).toBe(true);
  });

  it("blocks a manager from another branch", () => {
    expect(canActOnHotel(manager, "gwala-dham")).toBe(false);
  });

  it("blocks an inactive user everywhere", () => {
    expect(canActOnHotel({ ...owner, active: false }, "gwala-inn")).toBe(false);
    expect(canActOnHotel({ ...manager, active: false }, "gwala-inn")).toBe(
      false
    );
  });

  it("blocks a manager with no branch assigned", () => {
    expect(canActOnHotel({ ...manager, hotelId: null }, "gwala-inn")).toBe(
      false
    );
  });
});
