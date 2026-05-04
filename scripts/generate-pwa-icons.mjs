/**
 * One-shot: generates public/icons/*.png for PWA / Apple touch.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

// Calm teal aligned with app accents
const bg = { r: 13, g: 148, b: 136, alpha: 1 };

for (const size of [180, 192, 512]) {
  const file = join(outDir, `icon-${size}.png`);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .png()
    .toFile(file);
  console.log("wrote", file);
}
