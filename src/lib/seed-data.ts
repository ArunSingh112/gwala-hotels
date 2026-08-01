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
    gallery: ["/hotels/gwala-inn/hero.jpg"],
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
    gallery: ["/hotels/gwala-dham/hero.jpg"],
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
    gallery: ["/hotels/gwala-palace/hero.jpg"],
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
    gallery: ["/hotels/gwala-residency/hero.jpg"],
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
    gallery: ["/hotels/gwala-bhawan/hero.jpg"],
    checkInTime: "12:00",
    checkOutTime: "10:00",
    active: true,
    sortOrder: 5,
  },
];

// Placeholder room types, identical for all five branches. These are guesses
// at typical mid-range Vrindavan rates; the owner replaces them in the admin
// panel (isSeedData drives the "sample data" banner until then).
export const SEED_ROOM_TYPES: (RoomType & { id: string })[] = [
  {
    id: "standard-double",
    name: "Standard Double",
    description:
      "A clean, simply furnished room with a double bed, attached bathroom and hot water. Suits a couple or a small family travelling light.",
    pricePerNight: 1200,
    maxAdults: 2,
    maxChildren: 1,
    totalRooms: 8,
    amenities: ["Attached bathroom", "Hot water", "Fan", "TV"],
    images: [],
    active: true,
    sortOrder: 1,
    isSeedData: true,
  },
  {
    id: "deluxe-double-ac",
    name: "Deluxe Double (AC)",
    description:
      "A larger air-conditioned room with a double bed, ideal in the summer months. Attached bathroom with geyser.",
    pricePerNight: 1800,
    maxAdults: 2,
    maxChildren: 1,
    totalRooms: 6,
    amenities: ["Air conditioning", "Attached bathroom", "Geyser", "TV"],
    images: [],
    active: true,
    sortOrder: 2,
    isSeedData: true,
  },
  {
    id: "family-room",
    name: "Family Room",
    description:
      "Two double beds in one large room, comfortable for parents with children or a small group travelling together.",
    pricePerNight: 2800,
    maxAdults: 4,
    maxChildren: 2,
    totalRooms: 4,
    amenities: ["Air conditioning", "Two double beds", "Attached bathroom", "TV"],
    images: [],
    active: true,
    sortOrder: 3,
    isSeedData: true,
  },
  {
    id: "suite",
    name: "Suite",
    description:
      "The largest room in the house: a bedroom with a separate sitting area, air conditioning throughout and space for an extra bed.",
    pricePerNight: 3500,
    maxAdults: 3,
    maxChildren: 2,
    totalRooms: 2,
    amenities: [
      "Air conditioning",
      "Separate sitting area",
      "Attached bathroom",
      "Mini fridge",
      "TV",
    ],
    images: [],
    active: true,
    sortOrder: 4,
    isSeedData: true,
  },
];
