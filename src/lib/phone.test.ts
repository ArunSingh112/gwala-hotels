import { describe, expect, it } from "vitest";
import { normalisePhone } from "./phone";

describe("normalisePhone", () => {
  it("accepts a bare 10-digit Indian mobile", () => {
    expect(normalisePhone("9876543210")).toBe("919876543210");
  });

  it("accepts +91 prefix with spaces", () => {
    expect(normalisePhone("+91 98765 43210")).toBe("919876543210");
  });

  it("accepts 91 prefix without plus", () => {
    expect(normalisePhone("919876543210")).toBe("919876543210");
  });

  it("accepts 0 trunk prefix", () => {
    expect(normalisePhone("09876543210")).toBe("919876543210");
  });

  it("strips dashes and parentheses", () => {
    expect(normalisePhone("(+91) 98765-43210")).toBe("919876543210");
  });

  it("rejects numbers that are too short or too long", () => {
    expect(normalisePhone("98765")).toBeNull();
    expect(normalisePhone("98765432101234")).toBeNull();
  });

  it("rejects Indian mobiles not starting 6-9", () => {
    // Indian mobile numbers start with 6, 7, 8 or 9.
    expect(normalisePhone("1234567890")).toBeNull();
    expect(normalisePhone("5876543210")).toBeNull();
  });

  it("rejects non-numeric junk", () => {
    expect(normalisePhone("call me maybe")).toBeNull();
    expect(normalisePhone("")).toBeNull();
  });
});
