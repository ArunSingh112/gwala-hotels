/**
 * Seed script: writes the five branches and their placeholder room types to
 * Firestore, and creates the owner's admin account.
 *
 * Usage:
 *   npm run seed -- --owner-email you@example.com --owner-password <password> --owner-name "Owner Name"
 *
 * Requires FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
 * in .env.local (loaded below). Safe to re-run: hotels and room types are
 * overwritten with seed values only if they still carry isSeedData; an
 * existing owner account is left untouched.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { SEED_HOTELS, SEED_ROOM_TYPES_BY_HOTEL } from "../src/lib/seed-data";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Missing Firebase Admin credentials in .env.local — see .env.example."
    );
    process.exit(1);
  }

  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  const db = getFirestore(app);
  const auth = getAuth(app);

  // --- Hotels and room types -------------------------------------------------
  for (const hotel of SEED_HOTELS) {
    const hotelRef = db.collection("hotels").doc(hotel.slug);
    const existing = await hotelRef.get();
    if (existing.exists) {
      console.log(`hotels/${hotel.slug} already exists — leaving as-is`);
    } else {
      await hotelRef.set(hotel);
      console.log(`hotels/${hotel.slug} created`);
    }

    const roomTypes = SEED_ROOM_TYPES_BY_HOTEL[hotel.slug] ?? [];
    const seedIds = new Set(roomTypes.map((rt) => rt.id));

    for (const { id, ...roomType } of roomTypes) {
      const rtRef = hotelRef.collection("roomTypes").doc(id);
      const rtSnap = await rtRef.get();
      if (rtSnap.exists && !rtSnap.data()?.isSeedData) {
        console.log(
          `  roomTypes/${id} has real data — leaving as-is`
        );
        continue;
      }
      await rtRef.set(roomType);
      console.log(`  roomTypes/${id} seeded`);
    }

    // Remove stale seed room types no longer in the seed list (real data
    // — anything without isSeedData — is never touched).
    const allRts = await hotelRef.collection("roomTypes").get();
    for (const doc of allRts.docs) {
      if (!seedIds.has(doc.id) && doc.data()?.isSeedData) {
        await doc.ref.delete();
        console.log(`  roomTypes/${doc.id} removed (stale seed data)`);
      }
    }
  }

  // --- Owner account ---------------------------------------------------------
  const ownerEmail = arg("owner-email");
  const ownerPassword = arg("owner-password");
  const ownerName = arg("owner-name") ?? "Owner";

  if (!ownerEmail || !ownerPassword) {
    console.log(
      "\nNo --owner-email/--owner-password given; skipping owner account."
    );
    return;
  }

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(ownerEmail);
    uid = existing.uid;
    console.log(`Auth user ${ownerEmail} already exists (${uid})`);
  } catch {
    const created = await auth.createUser({
      email: ownerEmail,
      password: ownerPassword,
      displayName: ownerName,
    });
    uid = created.uid;
    console.log(`Auth user ${ownerEmail} created (${uid})`);
  }

  const userRef = db.collection("users").doc(uid);
  if ((await userRef.get()).exists) {
    console.log(`users/${uid} already exists — leaving as-is`);
  } else {
    await userRef.set({
      email: ownerEmail,
      name: ownerName,
      role: "owner",
      hotelId: null,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`users/${uid} created with role owner`);
  }

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
