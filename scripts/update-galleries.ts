/**
 * Push heroImage + gallery from seed data to the existing hotel documents.
 * Only touches those two fields; everything else is left as-is.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { SEED_HOTELS } from "../src/lib/seed-data";

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase Admin credentials in .env.local");
    process.exit(1);
  }
  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  const db = getFirestore(app);

  for (const hotel of SEED_HOTELS) {
    await db.collection("hotels").doc(hotel.slug).update({
      heroImage: hotel.heroImage,
      gallery: hotel.gallery,
    });
    console.log(`${hotel.slug}: gallery updated (${hotel.gallery.length} images)`);
  }
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
