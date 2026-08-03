// Pure helpers for gallery/images array mutations. Kept free of Firebase
// imports so they are unit-testable.

export const MAX_PHOTOS = 20;

export function appendPhoto(current: string[], url: string): string[] {
  if (current.includes(url)) {
    throw new Error("This photo is already in the list.");
  }
  if (current.length >= MAX_PHOTOS) {
    throw new Error(`Maximum of ${MAX_PHOTOS} photos reached. Delete one first.`);
  }
  return [...current, url];
}

export function removePhoto(current: string[], url: string): string[] {
  if (!current.includes(url)) {
    throw new Error("Photo not found in the list.");
  }
  return current.filter((u) => u !== url);
}

/** True when b contains exactly the same items as a (any order). */
export function isPermutation(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const count = new Map<string, number>();
  for (const x of a) count.set(x, (count.get(x) ?? 0) + 1);
  for (const x of b) {
    const c = count.get(x);
    if (!c) return false;
    count.set(x, c - 1);
  }
  return true;
}

/** True when the url points at an object in our Storage bucket. */
export function isOwnStorageUrl(url: string, bucket: string): boolean {
  return url.startsWith(
    `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/`
  );
}

/** Extract the Storage object path from one of our download urls. */
export function storagePathFromUrl(url: string, bucket: string): string | null {
  const prefix = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/`;
  if (!url.startsWith(prefix)) return null;
  const encoded = url.slice(prefix.length).split("?")[0];
  return decodeURIComponent(encoded);
}
