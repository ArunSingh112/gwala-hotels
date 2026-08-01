# Gwala Hotels — Multi-Branch Booking System

**Date:** 2026-08-01
**Status:** Approved design, ready for implementation planning

## Purpose

One website through which a guest can book a room at any of the five Gwala Hotels
branches in Vrindavan, and one admin panel through which the owner and branch
managers see and manage every booking.

Today there is no system: bookings arrive by phone and live in a paper register,
so the owner has no single view of the business and rooms can be promised twice.

## Success criteria

1. A guest on a phone can go from the home page to a confirmed booking request in
   under two minutes, without creating an account.
2. Two guests booking the last available room at the same moment cannot both
   succeed.
3. The owner sees every booking across all five branches in one list, and each
   branch manager sees only their own branch.
4. The site costs nothing to run: Firebase Spark plan and Vercel free tier, no
   card on file.

## Scope decisions

These were settled during brainstorming and are fixed for this phase.

| Decision | Choice | Consequence |
|---|---|---|
| Payment | Pay at hotel only | No gateway, no refunds, no PCI scope. Bookings are requests the hotel confirms. |
| Availability | Real inventory tracking | Owner enters room counts per type; the site only offers what is genuinely free. |
| Notifications | WhatsApp click-to-chat + admin panel | Zero cost, no Meta approval. Messages are user-initiated, not automatic. |
| Admin access | Owner + per-branch managers | Role stored per user; managers scoped to one `hotelId`. |
| Language | English only | No i18n layer. |
| Photos | Files in the project folder | No upload UI in the admin panel; photos are added by placing files and redeploying. |
| Architecture | Next.js with server-side Firestore writes | Clients read only; all writes go through server routes using the Admin SDK. |

### Explicitly out of scope

Online payments, discount codes, seasonal or dynamic pricing, Hindi or any second
language, email, SMS, automated WhatsApp Business API, photo upload from the
admin panel, channel-manager integration with OTAs, and housekeeping or
staff-rostering features.

Each of these can be added later; none of them are designed for now, and no
half-built hooks for them should be committed.

## The five branches

Addresses below were resolved from the owner's Google Maps links.

| # | Name | Slug | Address |
|---|---|---|---|
| 1 | Hotel Gwala Inn | `gwala-inn` | HM8H+MCM, Unnamed Road, Chaitanya Vihar, Vrindavan, Uttar Pradesh 281121 |
| 2 | Gwala Dham | `gwala-dham` | Sarswati Vihar, near Maltilavel car parking, Chaitanya Vihar, Vrindavan, Mathura, Uttar Pradesh 281121 |
| 3 | Gwala Palace | `gwala-palace` | Near Vidhyapith Chauraha, Gandhi Nagar, Kishor Pura, Vrindavan, Uttar Pradesh 281121 |
| 4 | Gwala Residency | `gwala-residency` | Near Vidhyapith Chauraha, Gandhi Nagar, Kishor Pura, Vrindavan, Uttar Pradesh 281121 |
| 5 | Gwala Bhawan | `gwala-bhawan` | Banke Bihari Mandir St, Bankebihari Colony, Vrindavan, Mathura, Uttar Pradesh 281121 |

Gwala Palace and Gwala Residency share an address deliberately — they sit at the
same location. Both branch pages therefore show the same map, and the copy on each
should say so plainly rather than leave a guest wondering whether it is an error.

**Maps without an API key.** Google's Maps Embed API needs a billed key, and the
short links resolve to place identifiers rather than coordinates. Each branch page
therefore embeds `https://www.google.com/maps?ftid=<placeId>&output=embed`, which
is free and pins the exact listing. The identifiers:

| Branch | `ftid` |
|---|---|
| Gwala Inn | `0x39736e2188289e23:0xcf40b8cf22942997` |
| Gwala Dham | `0x39736f28d5772d9d:0xcaa3124d6402dc5d` |
| Gwala Palace and Gwala Residency | `0x39736f00672c8bad:0x9af7ba8c8ab7763d` |
| Gwala Bhawan | `0x39736f9bc9922ee9:0xfc451e18491762d4` |

A "Get directions" button beside each map opens the original `maps.app.goo.gl`
link, which behaves better on phones than an embedded map does.

**Two notes for the owner, not blocking.** Gwala Inn is listed on Google as
"Gwala Guest House" and Gwala Palace as "Gwala palaca"; correcting those listings
would help guests find the right place. Separately, Gwala Bhawan stands on Banke
Bihari Mandir Street — worth leading with on that branch's page and in its page
title, since proximity to the temple is what most pilgrims search for.

**Contact.** All five branches share one WhatsApp and phone number,
**+91 70601 89819** (`917060189819` in click-to-chat links). The number is stored
per branch rather than globally, so any branch can be given its own later without
a code change.

## Placeholder content

Real room types, prices and photographs will come later. Development uses the
placeholders below so every screen can be built and tested against realistic data.

**Room types.** The same four are seeded for all five branches, at rates typical
of mid-range Vrindavan guest houses:

| Room type | Rate / night | Sleeps | Rooms per branch |
|---|---|---|---|
| Standard Double | ₹1,200 | 2 adults + 1 child | 8 |
| Deluxe Double (AC) | ₹1,800 | 2 adults + 1 child | 6 |
| Family Room | ₹2,800 | 4 adults + 2 children | 4 |
| Suite | ₹3,500 | 3 adults + 2 children | 2 |

These are guesses, not the business's real rates. The owner edits all of it in the
admin panel after deployment — no code change and no redeploy is needed, because
room types and prices are Firestore data, not configuration.

**Photographs.** Until real photos arrive, each branch uses a locally generated
placeholder image carrying the branch name, stored at
`/public/hotels/<slug>/`. They are deliberately plain, so nobody mistakes a
placeholder for finished work. Replacing them means dropping real files into that
folder under the same names.

**A seeded-data banner** appears in the admin dashboard while any branch still
holds placeholder rates, reading "Rooms and prices are still sample data" with a
link to the rooms screen. It disappears once the owner saves real values, so the
site cannot quietly go live quoting ₹1,200 for a room that costs ₹2,500.

## Architecture

A single Next.js 15 application (App Router, TypeScript) serving both the public
site and the admin panel, deployed to Vercel's free tier, with Firebase Firestore
as the database and Firebase Auth for admin logins.

```
Browser (guest)          Browser (admin)
      |                        |
      | read-only Firestore    | Firebase Auth ID token
      | for public content     |
      v                        v
   +-------------------------------------+
   |      Next.js on Vercel (free)       |
   |  pages + /api route handlers        |
   |  firebase-admin (service account)   |
   +-------------------------------------+
                    |
                    v
              Cloud Firestore
```

**Why writes go through the server.** Every mutation — creating a booking,
cancelling one, changing a status, editing rooms and prices, moderating reviews —
runs in a Next.js route handler using the Firebase Admin SDK. Firestore security
rules then deny all client writes outright. This makes the availability
transaction trustworthy: the check and the reservation happen in one atomic
server-side operation that a browser cannot bypass or forge. It also keeps the
role check in one place. The cost is one service-account key held in Vercel's
environment variables.

**Why not Cloud Functions.** They require the paid Blaze plan. Vercel's free tier
runs the same server code at no cost.

**Why not a single-page app.** A hotel is found through Google. Server-rendered
pages with correct metadata and structured data are worth more here than the
simplicity of an SPA.

## Data model

Firestore, five top-level collections.

### `hotels/{hotelId}`

`hotelId` is the slug, e.g. `gwala-inn`.

```
name          string   "Hotel Gwala Inn"
slug          string   "gwala-inn"
tagline       string
description   string
address       string
mapsUrl       string   the maps.app.goo.gl short link, for "Get directions"
mapFtid       string   Google place id, used for the keyless embed
distances     map      attraction slug -> human text, e.g. "5 min walk"
phone         string   E.164, used for WhatsApp click-to-chat: "919XXXXXXXXX"
displayPhone  string   "+91 9XXX XXX XXX"
email         string
amenities     string[] ["Free WiFi", "Power backup", "Temple shuttle"]
heroImage     string   "/hotels/gwala-inn/hero.jpg"
gallery       string[] paths under /public
checkInTime   string   "12:00"
checkOutTime  string   "10:00"
active        boolean  hidden from the public site when false
sortOrder     number
```

### `hotels/{hotelId}/roomTypes/{roomTypeId}`

```
name          string   "Deluxe Double"
description   string
pricePerNight number   in rupees, integer
maxAdults     number
maxChildren   number
totalRooms    number   how many of this type the branch has
amenities     string[]
images        string[]
active        boolean
sortOrder     number
```

Prices are stored as whole rupees. No decimals, no currency field — this business
is rupees-only.

### `availability/{hotelId}_{roomTypeId}_{YYYY-MM-DD}`

One document per room type per night. Created lazily: a missing document means
zero rooms taken.

```
hotelId       string
roomTypeId    string
date          string   "2026-08-14"
roomsBooked   number
```

Free rooms on a night = `roomTypes.totalRooms - roomsBooked`. A stay of N nights
occupies the nights from check-in up to but not including check-out, so a
14th–16th booking touches the 14th and 15th only.

Written exclusively inside server transactions. Never written by a client.

### `bookings/{bookingId}`

```
bookingCode      string  "GW-4XK92B", uppercase, unguessable, shown to the guest
hotelId          string
hotelName        string  denormalised so the list renders without joins
roomTypeId       string
roomTypeName     string
guestName        string
guestPhone       string
guestEmail       string  optional
guestCity        string  optional
checkIn          string  "2026-08-14"
checkOut         string  "2026-08-16"
nights           number
rooms            number
adults           number
children         number
pricePerNight    number  captured at booking time
totalAmount      number  pricePerNight * rooms * nights
paymentMode      string  always "pay_at_hotel" in this phase
status           string  see below
specialRequests  string  optional
source           string  "website"
createdAt        timestamp
updatedAt        timestamp
updatedBy        string   uid, or "guest"
cancelledAt      timestamp  optional
cancelReason     string     optional
```

**Status lifecycle.** Every website booking starts at `pending`. The permitted
transitions are exactly:

| From | To | Triggered by | Inventory effect |
|---|---|---|---|
| `pending` | `confirmed` | Admin accepts | none |
| `pending` | `cancelled` | Admin rejects, or guest cancels | releases rooms |
| `confirmed` | `checked_in` | Admin, on arrival | none |
| `confirmed` | `cancelled` | Admin, or guest cancels | releases rooms |
| `confirmed` | `no_show` | Admin, guest never arrived | releases rooms |
| `checked_in` | `checked_out` | Admin, on departure | none |

`checked_out`, `cancelled` and `no_show` are terminal. Any transition not in this
table is rejected by the server with a message naming the current status.

Rooms are reserved when the booking is created, not when it is confirmed —
otherwise the site could keep offering a room it has already promised to someone.
Only the three releasing transitions above give rooms back, and each does so in a
transaction that decrements every night of the stay.

### `reviews/{reviewId}`

```
hotelId      string
guestName    string
bookingCode  string   optional, lets the panel show "verified stay"
rating       number   1-5
title        string
text         string
status       string   "pending" | "approved" | "rejected"
createdAt    timestamp
moderatedBy  string   optional uid
```

Only `approved` reviews are publicly readable. A hotel's average rating and count
are computed on the server when its page renders.

### `users/{uid}`

`uid` matches the Firebase Auth user.

```
email     string
name      string
role      string   "owner" | "manager"
hotelId   string   the branch a manager is scoped to; null for owner
active    boolean
createdAt timestamp
```

The owner account is created once by a seed script. Managers are created by the
owner from the admin panel; the route handler creates the Auth user with the
Admin SDK and writes this document in the same request.

## Access control

Two layers, both required.

**Firestore security rules.** Public read on `hotels`, `roomTypes`, and reviews
where `status == "approved"`. No read access at all to `bookings`, `availability`
or `users` from a client. No write access to anything from a client. This is a
short, auditable rules file precisely because all real logic sits behind the
server.

**Server route handlers.** Every `/api/admin/*` route verifies the caller's
Firebase ID token, loads `users/{uid}`, rejects inactive users, and then applies
the role: an `owner` may act on any branch; a `manager` may act only where the
target document's `hotelId` equals their own. This check lives in one shared
helper so it cannot be forgotten in a new route. Public routes
(`/api/availability`, `/api/bookings`, `/api/bookings/lookup`) take no token and
are rate-limited by IP.

## Booking flow

1. **Search.** Guest picks a branch (or "any branch"), check-in and check-out
   dates, and the number of guests. `POST /api/availability` returns, for each
   room type, the minimum free count across every night in the range — a room
   type is offerable only if it is free on *all* nights, and only if it can seat
   the party.
2. **Choose.** Guest picks a room type and how many rooms, and sees the total:
   price per night × rooms × nights.
3. **Details.** Name and phone are required; email, city and special requests are
   optional. Validated with Zod on both sides; the server's validation is the one
   that counts. Indian mobile numbers are normalised to E.164.
4. **Submit.** `POST /api/bookings` runs one Firestore transaction that re-reads
   every night's availability document, aborts with a clear "just got booked"
   error if anything changed, increments `roomsBooked` on each night, and writes
   the booking as `pending`. The re-read inside the transaction is what makes step
   1's answer safe to act on.
5. **Confirm.** Guest lands on `/booking/confirmation/[code]` showing the booking
   code, the branch's address and phone, check-in time, the amount payable at the
   hotel, and a **Send on WhatsApp** button — a `wa.me` link to that branch's
   number with the booking details pre-filled.
6. **Later.** `/booking/lookup` finds a booking by code plus the phone number used
   to make it. From there the guest can request cancellation, which runs the
   inverse transaction and decrements each night.

Cancellation is free and immediate, because nothing has been paid.

## Admin panel

Route group `/admin`, guarded by Firebase Auth email-and-password login. Managers
land in a version of the panel filtered to their branch; the branch selector is
simply absent for them.

**Dashboard.** Today's arrivals and departures, current occupancy per branch,
count of pending requests needing a decision, bookings taken in the last seven
days, and expected revenue this month. Owner sees all branches; manager sees one.

**Bookings.** The main working screen. A table filterable by branch, status, date
range, and free-text search across booking code, guest name and phone. Row
actions confirm, cancel, mark checked-in, checked-out or no-show. Each row has a
one-click WhatsApp button to message that guest. A detail view shows everything
and allows editing special requests and internal notes.

**Calendar.** A month grid per branch, one row per room type, each cell showing
rooms booked out of total, coloured by how full it is. Makes a busy weekend
visible at a glance.

**Rooms & pricing.** Create and edit room types per branch: name, description,
price per night, occupancy, total rooms. Reducing `totalRooms` below what is
already booked on some night is rejected with a message naming those dates.

**Reviews.** Pending reviews with approve and reject buttons.

**Branch settings.** Description, amenities, address, maps link, phone, check-in
and check-out times.

**Users (owner only).** Create a manager, assign a branch, deactivate. The owner
cannot deactivate their own account.

## Public site

| Route | Contents |
|---|---|
| `/` | Hero, search widget, all five branches as cards, attractions teaser, approved reviews |
| `/hotels` | All branches with filters |
| `/hotels/[slug]` | Gallery, description, amenities, room types with prices, map, reviews, booking CTA |
| `/booking` | Search → choose room → details → submit |
| `/booking/confirmation/[code]` | Booking code, WhatsApp button, what to bring |
| `/booking/lookup` | Find by code + phone; cancel |
| `/attractions` | Banke Bihari, Prem Mandir, ISKCON, Nidhivan, Radha Raman and others, with photos and a line on what each is |
| `/about`, `/contact` | Group information; contact details for all branches |

**Distances to attractions.** No branch coordinates are available without a paid
Maps key, so distances are not computed. Instead each branch document holds an
optional `distances` map keyed by attraction (`{ "banke-bihari": "5 min walk" }`),
edited by the owner in branch settings and shown on that branch's page. Nothing is
displayed for an attraction with no entry — better an absent claim than an invented
one, since a guest who was promised a five-minute walk and got a thirty-minute one
leaves a bad review.

**SEO.** Per-page titles and descriptions, Open Graph tags, JSON-LD `Hotel`
structured data on each branch page including address, price range and aggregate
rating, plus `sitemap.xml` and `robots.txt`. The attractions page exists partly to
rank for the searches pilgrims actually type.

**Visual direction.** Warm and grounded rather than corporate: marigold and
saffron accents, cream backgrounds, deep maroon text, generous photography, large
tap targets. Mobile-first and light enough to load on a patchy 4G connection,
since most guests will arrive on a phone.

**Accessibility.** Semantic markup, labelled form controls, visible focus rings,
and text contrast meeting WCAG AA.

## Error handling

| Situation | Behaviour |
|---|---|
| Rooms taken between search and submit | Transaction aborts; guest sees "Those rooms were just booked" and is returned to results with dates preserved |
| Check-out on or before check-in | Rejected client-side and server-side |
| Dates in the past, or more than 12 months ahead | Rejected |
| Invalid phone number | Rejected with a specific message, not a generic failure |
| Firestore unreachable | Guest sees a retry prompt and the branch's phone number so the booking is not lost |
| Manager acts on another branch | 403; the attempt is logged |
| Expired admin session | Redirect to login, returning to the intended page afterwards |
| Duplicate booking code | Regenerate and retry, up to three attempts |

Server routes return a consistent JSON error shape with a machine-readable code
and a human message. Internal details never reach the browser.

## Testing

**Unit (Vitest).** Nightly-range expansion, availability arithmetic, price
calculation, booking-code generation, phone normalisation, and the role-check
helper — including a manager attempting to reach another branch.

**Integration (Vitest + Firestore emulator).** Booking creation reserves every
night; cancellation releases them; two concurrent bookings for one remaining room
produce exactly one success and one clean failure; reducing `totalRooms` below
current bookings is refused. These run against the emulator, so no live data and
no cost.

**Manual smoke test before launch.** Book on a real phone, confirm from the panel,
cancel, verify inventory returns, and check that a manager login cannot see
another branch.

## Configuration

Environment variables, none committed:

```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY            service account, server only
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_SITE_URL
```

`.env.local` is git-ignored; `.env.example` documents the shape.

## Build order

1. Project scaffold, Tailwind, Firebase Admin and client initialisation, env plumbing
2. Data model, security rules, seed script for the five branches, owner account
3. Availability engine and its tests — the core, built before any UI
4. Booking API routes with transactional create and cancel, plus emulator tests
5. Public site: layout, home, branch pages, attractions
6. Booking flow UI and confirmation with the WhatsApp link
7. Admin auth, role guard, bookings table
8. Admin dashboard, calendar, rooms and pricing
9. Reviews (submission, moderation, display) and user management
10. SEO, accessibility pass, performance pass, deploy

Steps 3 and 4 come before any interface deliberately: the correctness of this
system lives in the availability transaction, and it is far easier to prove there
than through a browser.

## Open items for the owner

Only the first of these blocks development.

1. **Firebase project credentials** — nothing can be stored without them.
2. **Real room types, counts and nightly rates** per branch, replacing the
   placeholders. Entered in the admin panel; no redeploy needed.
3. **Photographs** for each branch, dropped into `/public/hotels/<slug>/`.
4. **Walking or driving times** from each branch to the main temples, if those
   distances are to be shown.
5. **Optional:** correcting the Google listings — Gwala Inn appears as "Gwala
   Guest House" and Gwala Palace as "Gwala palaca".
