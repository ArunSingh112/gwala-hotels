/**
 * One-time setup: creates the composite indexes the app's queries need,
 * using the Admin SDK service account from .env.local (no firebase login
 * required). Safe to re-run — "already exists" responses are reported and
 * skipped.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { GoogleAuth } from "google-auth-library";

const INDEXES: { collectionGroup: string; fields: { fieldPath: string; order: "ASCENDING" | "DESCENDING" }[] }[] = [
  // Public homepage / hotel page reviews + admin moderation (owner scope)
  {
    collectionGroup: "reviews",
    fields: [
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  // Hotel-scoped reviews (public hotel page, manager moderation)
  {
    collectionGroup: "reviews",
    fields: [
      { fieldPath: "hotelId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  // Admin bookings list: hotel filter
  {
    collectionGroup: "bookings",
    fields: [
      { fieldPath: "hotelId", order: "ASCENDING" },
      { fieldPath: "checkIn", order: "DESCENDING" },
    ],
  },
  // Admin bookings list: status filter
  {
    collectionGroup: "bookings",
    fields: [
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "checkIn", order: "DESCENDING" },
    ],
  },
  // Admin bookings list: hotel + status
  {
    collectionGroup: "bookings",
    fields: [
      { fieldPath: "hotelId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "checkIn", order: "DESCENDING" },
    ],
  },
];

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase Admin credentials in .env.local");
    process.exit(1);
  }

  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/datastore"],
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;

  for (const idx of INDEXES) {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/${idx.collectionGroup}/indexes`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryScope: "COLLECTION",
        fields: idx.fields,
      }),
    });
    const label = `${idx.collectionGroup}(${idx.fields.map((f) => f.fieldPath).join(", ")})`;
    if (res.ok) {
      console.log(`created: ${label}`);
    } else {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { error?: { message?: string } }).error?.message ?? res.statusText;
      if (res.status === 409) {
        console.log(`exists:  ${label}`);
      } else {
        console.error(`FAILED:  ${label} — ${msg}`);
      }
    }
  }
  console.log("\nDone. Indexes build in the background (usually 1–5 minutes).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
