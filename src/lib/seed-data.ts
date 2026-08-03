import type { Hotel, RoomType } from "@/lib/types";

// The five branches, from the design spec. Addresses were resolved from the
// owner's Google Maps links; Gwala Palace and Gwala Residency genuinely share
// one address and therefore one map ftid.
//
// All branches currently share one WhatsApp/phone number. It is stored per
// branch so any branch can be given its own later without a code change.
const SHARED_PHONE = "917060189819";
const SHARED_DISPLAY_PHONE = "+91 70601 89819";

type SeedHotel = Hotel; // ids come from the slug

export const SEED_HOTELS: SeedHotel[] = [
  {
    name: "Hotel Gwala Inn",
    slug: "gwala-inn",
    tagline: "A quiet base in Chaitanya Vihar",
    description:
      "Hotel Gwala Inn sits in the calm lanes of Chaitanya Vihar, away from the crowds but a short ride from Banke Bihari Mandir and Prem Mandir. Simple, clean rooms for pilgrims and families who want a restful night between darshans.",
    address:
      "HM8H+MCM, Unnamed Road, Chaitanya Vihar, Vrindavan, Uttar Pradesh 281121",
    mapsUrl: "https://maps.app.goo.gl/gwala-inn",
    mapFtid: "0x39736e2188289e23:0xcf40b8cf22942997",
    distances: {},
    phone: SHARED_PHONE,
    displayPhone: SHARED_DISPLAY_PHONE,
    email: "",
    amenities: ["Free WiFi", "Power backup", "24-hour front desk", "Parking"],
    heroImage: "/hotels/gwala-inn/hero.jpg",
    gallery: [
      "/hotels/gwala-inn/hero.jpg",
      "/hotels/gwala-inn/gallery-2.jpg",
      "/hotels/gwala-inn/gallery-3.jpg",
      "/hotels/gwala-inn/gallery-4.jpg",
    ],
    checkInTime: "12:00",
    checkOutTime: "10:00",
    active: true,
    sortOrder: 1,
  },
  {
    name: "Gwala Dham",
    slug: "gwala-dham",
    tagline: "Comfort near Chaitanya Vihar's car parking",
    description:
      "Gwala Dham stands in Sarswati Vihar near the Maltilavel car parking, convenient for guests arriving by road. Spacious rooms and easy access to the main temple circuit make it a practical choice for family groups.",
    address:
      "Sarswati Vihar, near Maltilavel car parking, Chaitanya Vihar, Vrindavan, Mathura, Uttar Pradesh 281121",
    mapsUrl: "https://maps.app.goo.gl/gwala-dham",
    mapFtid: "0x39736f28d5772d9d:0xcaa3124d6402dc5d",
    distances: {},
    phone: SHARED_PHONE,
    displayPhone: SHARED_DISPLAY_PHONE,
    email: "",
    amenities: ["Free WiFi", "Power backup", "Car parking", "Room service"],
    heroImage: "/hotels/gwala-dham/hero.jpg",
    gallery: [
      "/hotels/gwala-dham/hero.jpg",
      "/hotels/gwala-dham/gallery-2.jpg",
      "/hotels/gwala-dham/gallery-3.jpg",
      "/hotels/gwala-dham/gallery-4.jpg",
      "/hotels/gwala-dham/gallery-5.jpg",
    ],
    checkInTime: "12:00",
    checkOutTime: "10:00",
    active: true,
    sortOrder: 2,
  },
  {
    name: "Gwala Palace",
    slug: "gwala-palace",
    tagline: "Beside Gwala Residency at Vidhyapith Chauraha",
    description:
      "Gwala Palace stands near Vidhyapith Chauraha in Gandhi Nagar, at the same location as its sister property Gwala Residency — two buildings, one address, so booking either brings you to the same friendly doorstep. Well placed for reaching every major temple.",
    address:
      "Near Vidhyapith Chauraha, Gandhi Nagar, Kishor Pura, Vrindavan, Uttar Pradesh 281121",
    mapsUrl: "https://maps.app.goo.gl/gwala-palace",
    mapFtid: "0x39736f00672c8bad:0x9af7ba8c8ab7763d",
    distances: {},
    phone: SHARED_PHONE,
    displayPhone: SHARED_DISPLAY_PHONE,
    email: "",
    amenities: ["Free WiFi", "Power backup", "Lift", "Room service"],
    heroImage: "/hotels/gwala-palace/hero.jpg",
    gallery: [
      "/hotels/gwala-palace/hero.jpg",
      "/hotels/gwala-palace/gallery-2.jpg",
      "/hotels/gwala-palace/gallery-3.jpg",
      "/hotels/gwala-palace/gallery-4.jpg",
      "/hotels/gwala-palace/gallery-5.jpg",
    ],
    checkInTime: "12:00",
    checkOutTime: "10:00",
    active: true,
    sortOrder: 3,
  },
  {
    name: "Gwala Residency",
    slug: "gwala-residency",
    tagline: "Beside Gwala Palace at Vidhyapith Chauraha",
    description:
      "Gwala Residency shares its address with Gwala Palace near Vidhyapith Chauraha — two buildings at one location, so booking either brings you to the same friendly doorstep. Comfortable rooms with quick routes to the temple circuit.",
    address:
      "Near Vidhyapith Chauraha, Gandhi Nagar, Kishor Pura, Vrindavan, Uttar Pradesh 281121",
    mapsUrl: "https://maps.app.goo.gl/gwala-residency",
    mapFtid: "0x39736f00672c8bad:0x9af7ba8c8ab7763d",
    distances: {},
    phone: SHARED_PHONE,
    displayPhone: SHARED_DISPLAY_PHONE,
    email: "",
    amenities: ["Free WiFi", "Power backup", "Room service", "Parking"],
    heroImage: "/hotels/gwala-residency/hero.jpg",
    gallery: [
      "/hotels/gwala-residency/hero.jpg",
      "/hotels/gwala-residency/gallery-2.jpg",
      "/hotels/gwala-residency/gallery-3.jpg",
      "/hotels/gwala-residency/gallery-4.jpg",
    ],
    checkInTime: "12:00",
    checkOutTime: "10:00",
    active: true,
    sortOrder: 4,
  },
  {
    name: "Gwala Bhawan",
    slug: "gwala-bhawan",
    tagline: "On Banke Bihari Mandir Street",
    description:
      "Gwala Bhawan stands on Banke Bihari Mandir Street itself, in Bankebihari Colony — the closest Gwala branch to the temple most pilgrims come for. Step out of the door and you are already on the street that leads to darshan.",
    address:
      "Banke Bihari Mandir St, Bankebihari Colony, Vrindavan, Mathura, Uttar Pradesh 281121",
    mapsUrl: "https://maps.app.goo.gl/gwala-bhawan",
    mapFtid: "0x39736f9bc9922ee9:0xfc451e18491762d4",
    distances: {},
    phone: SHARED_PHONE,
    displayPhone: SHARED_DISPLAY_PHONE,
    email: "",
    amenities: ["Free WiFi", "Power backup", "24-hour front desk"],
    heroImage: "/hotels/gwala-bhawan/hero.jpg",
    gallery: [
      "/hotels/gwala-bhawan/hero.jpg",
      "/hotels/gwala-bhawan/gallery-2.jpg",
      "/hotels/gwala-bhawan/gallery-3.jpg",
      "/hotels/gwala-bhawan/gallery-4.jpg",
    ],
    checkInTime: "12:00",
    checkOutTime: "10:00",
    active: true,
    sortOrder: 5,
  },
];

// Real room inventory per branch (bed count = max guests), from the owner.
// Rates are placeholders until the owner sets them in the admin panel
// (isSeedData drives the "sample data" banner until then).
const ROOM_TYPE_BASE: Record<
  "double" | "triple" | "quad",
  Omit<RoomType, "totalRooms">
> = {
  double: {
    name: "2 Bed Room",
    description:
      "A clean, simply furnished room for two guests with attached bathroom and hot water. Suits a couple or two pilgrims travelling together.",
    pricePerNight: 1200,
    maxAdults: 2,
    maxChildren: 1,
    amenities: ["Attached bathroom", "Hot water", "TV"],
    images: [],
    active: true,
    sortOrder: 1,
    isSeedData: true,
  },
  triple: {
    name: "3 Bed Room",
    description:
      "A larger room sleeping three guests, with attached bathroom and hot water. Comfortable for a small family or group.",
    pricePerNight: 1800,
    maxAdults: 3,
    maxChildren: 1,
    amenities: ["Attached bathroom", "Hot water", "TV"],
    images: [],
    active: true,
    sortOrder: 2,
    isSeedData: true,
  },
  quad: {
    name: "4 Bed Room",
    description:
      "The largest room in the house: four beds for a family or group travelling together, with attached bathroom and hot water.",
    pricePerNight: 2400,
    maxAdults: 4,
    maxChildren: 2,
    amenities: ["Attached bathroom", "Hot water", "TV"],
    images: [],
    active: true,
    sortOrder: 3,
    isSeedData: true,
  },
};

const ROOM_TYPE_IDS: Record<keyof typeof ROOM_TYPE_BASE, string> = {
  double: "2-bed-room",
  triple: "3-bed-room",
  quad: "4-bed-room",
};

function room(
  kind: keyof typeof ROOM_TYPE_BASE,
  totalRooms: number
): RoomType & { id: string } {
  return { id: ROOM_TYPE_IDS[kind], ...ROOM_TYPE_BASE[kind], totalRooms };
}

/** Room types per branch slug — counts are the owner's real inventory. */
export const SEED_ROOM_TYPES_BY_HOTEL: Record<
  string,
  (RoomType & { id: string })[]
> = {
  "gwala-inn": [room("double", 10), room("triple", 3), room("quad", 3)],
  "gwala-dham": [room("double", 18)],
  "gwala-palace": [room("double", 7), room("triple", 4)],
  "gwala-residency": [room("double", 8), room("quad", 3)],
  "gwala-bhawan": [room("double", 11)],
};
