/**
 * Generates deliberately plain placeholder hero images for each branch, so
 * nobody mistakes a placeholder for finished work. Real photos replace these
 * files under the same names in /public/hotels/<slug>/hero.jpg.
 *
 * Usage: npx tsx scripts/generate-placeholders.ts
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BRANCHES = [
  { slug: "gwala-inn", name: "Hotel Gwala Inn" },
  { slug: "gwala-dham", name: "Gwala Dham" },
  { slug: "gwala-palace", name: "Gwala Palace" },
  { slug: "gwala-residency", name: "Gwala Residency" },
  { slug: "gwala-bhawan", name: "Gwala Bhawan" },
];

const W = 1500;
const H = 600;

async function main() {
  for (const { slug, name } of BRANCHES) {
    const dir = path.join("public", "hotels", slug);
    mkdirSync(dir, { recursive: true });

    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#f4e9d8"/>
      <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none"
            stroke="#b74206" stroke-width="3" stroke-dasharray="14 10"/>
      <text x="50%" y="46%" text-anchor="middle" font-family="Georgia, serif"
            font-size="72" fill="#5c1a1a">${name}</text>
      <text x="50%" y="60%" text-anchor="middle" font-family="Georgia, serif"
            font-size="30" fill="#94320c">Placeholder — real photo coming soon</text>
    </svg>`;

    const out = path.join(dir, "hero.jpg");
    await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toFile(out);
    console.log(`wrote ${out}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
