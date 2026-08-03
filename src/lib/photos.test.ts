import { describe, expect, it } from "vitest";
import {
  appendPhoto,
  removePhoto,
  isPermutation,
  isOwnStorageUrl,
  MAX_PHOTOS,
} from "./photos";

describe("appendPhoto", () => {
  it("appends a url to the end", () => {
    expect(appendPhoto(["a"], "b")).toEqual(["a", "b"]);
  });
  it("refuses duplicates", () => {
    expect(() => appendPhoto(["a"], "a")).toThrow(/already/i);
  });
  it("refuses beyond MAX_PHOTOS", () => {
    const full = Array.from({ length: MAX_PHOTOS }, (_, i) => `p${i}`);
    expect(() => appendPhoto(full, "extra")).toThrow(/maximum/i);
  });
});

describe("removePhoto", () => {
  it("removes the url", () => {
    expect(removePhoto(["a", "b"], "a")).toEqual(["b"]);
  });
  it("throws when the url is absent", () => {
    expect(() => removePhoto(["a"], "x")).toThrow(/not found/i);
  });
});

describe("isPermutation", () => {
  it("true for same items reordered", () => {
    expect(isPermutation(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
  });
  it("false when lengths differ", () => {
    expect(isPermutation(["a"], ["a", "a"])).toBe(false);
  });
  it("false when items differ", () => {
    expect(isPermutation(["a", "b"], ["a", "x"])).toBe(false);
  });
});

describe("isOwnStorageUrl", () => {
  const bucket = "arunhotels-e4da4.firebasestorage.app";
  it("true for our firebasestorage download url", () => {
    expect(
      isOwnStorageUrl(
        `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/hotels%2Fgwala-inn%2F1.jpg?alt=media&token=t`,
        bucket
      )
    ).toBe(true);
  });
  it("false for repo-local paths", () => {
    expect(isOwnStorageUrl("/hotels/gwala-inn/hero.jpg", bucket)).toBe(false);
  });
  it("false for other hosts", () => {
    expect(isOwnStorageUrl("https://example.com/x.jpg", bucket)).toBe(false);
  });
});
