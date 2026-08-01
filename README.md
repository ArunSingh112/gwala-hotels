# Gwala Hotels — Multi-Branch Booking System

One website through which a guest can book a room at any of the five Gwala
Hotels branches in Vrindavan, and one admin panel through which the owner and
branch managers manage every booking.

Design spec: `docs/superpowers/specs/2026-08-01-gwala-hotels-booking-system-design.md`

## Stack

- **Next.js 15** (App Router, TypeScript) — public site + admin panel + API
- **Firebase Firestore** — database (Spark plan, free)
- **Firebase Auth** — admin logins only; guests need no account
- **Tailwind CSS** — styling
- **Vercel free tier** — hosting; all writes run in route handlers via the
  Firebase Admin SDK, so no Cloud Functions (no paid Blaze plan) are needed

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in Firebase credentials
npm run dev
```

Without Firebase credentials the public site still renders using the seed
data in `src/lib/seed-data.ts`; booking APIs need real credentials.

## Setting up Firebase (one-time)

1. Create a Firebase project (Spark plan is enough).
2. Enable **Firestore** and **Authentication → Email/Password**.
3. Project settings → Service accounts → *Generate new private key*; copy the
   values into `.env.local` (see `.env.example`).
4. Project settings → General → *Your apps* → add a Web app; copy the client
   keys into `.env.local`.
5. Deploy the security rules: copy `firestore.rules` into the Firebase console
   (Firestore → Rules) or use `firebase deploy --only firestore:rules`.
6. Seed the five branches, placeholder room types and the owner account:

```bash
npm run seed -- --owner-email you@example.com --owner-password <password> --owner-name "Your Name"
```

7. Sign in at `/admin` and replace the placeholder rates in **Rooms &
   Pricing** — a banner reminds you until every branch has real values.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Vitest) |
| `npm run seed` | Seed branches, room types, owner account |
| `npx tsx scripts/generate-placeholders.ts` | Regenerate placeholder hero images |

### Integration tests (Firestore emulator)

The booking-transaction tests in `tests/integration/` need the Firestore
emulator (Java 11+ required):

```bash
firebase emulators:start --only firestore --project demo-gwala
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm test
```

They are skipped automatically when the emulator is not running.

## Deploying to Vercel

1. Import the repo in Vercel.
2. Add every variable from `.env.example` in Project → Settings →
   Environment Variables (paste `FIREBASE_PRIVATE_KEY` with its `\n`s intact,
   quotes and all).
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
4. Deploy.

## Replacing placeholder photos

Drop real photos into `public/hotels/<slug>/hero.jpg` (same names) and
redeploy. The placeholders are deliberately plain so nobody mistakes them for
finished work.

## Architecture notes

- **All writes are server-side.** Firestore rules deny every client write;
  mutations run in `/api` route handlers with the Admin SDK. The availability
  check and room reservation happen in one Firestore transaction
  (`src/lib/services/bookings.ts`), so two guests racing for the last room
  produce exactly one success.
- **Roles**: `owner` acts on all branches; `manager` only on their own
  (`src/lib/api/auth.ts` — used by every admin route).
- **Status lifecycle** is enforced by a single transition table
  (`src/lib/booking-status.ts`); releasing transitions return rooms to
  inventory inside the same transaction.
