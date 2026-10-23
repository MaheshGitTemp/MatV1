// scripts/watermarkExisting.js
// ─────────────────────────────────────────────────────────────────────────────
// One-off backfill: bake the watermark into EXISTING gallery photos that were
// uploaded before the watermark feature. New uploads are already watermarked by
// imageService at upload time.
//
// For each usergallery row where watermarked = false, it re-renders the ORIGINAL
// and MEDIUM files in place (compositing the watermark at each file's current
// dimensions) and leaves the THUMB untouched (thumbs are never watermarked).
// Then it sets watermarked = true, so the script is SAFE TO RE-RUN — already
// processed rows are skipped (no double-watermarking).
//
// Prereq: migration 005 (adds usergallery.watermarked) must be applied first.
//
// Usage (from backend/):
//   node scripts/watermarkExisting.js
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs   = require('fs');
const sharp = require('sharp');

require('dotenv').config({ path: path.join(__dirname, '..', 'src', '.env') });

const pool = require('../src/services/pool');
const { buildWatermarkSvg } = require('../src/services/imageService');

const PUBLIC_DIR = path.join(__dirname, '..', 'src', 'public');

// Re-render one existing file in place with the watermark composited on at the
// file's CURRENT dimensions (so we don't resize/alter the already-sized image).
async function watermarkFileInPlace(relPath, quality) {
  if (!relPath) return false;
  const fullPath = path.join(PUBLIC_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  skip (missing file): ${relPath}`);
    return false;
  }
  const input = await fs.promises.readFile(fullPath);
  const meta  = await sharp(input).metadata();
  const svg   = buildWatermarkSvg(meta.width, meta.height);
  const out   = await sharp(input)
    .composite([{ input: svg, gravity: 'center' }])
    .jpeg({ quality })
    .toBuffer();
  await fs.promises.writeFile(fullPath, out);
  return true;
}

async function main() {
  const { rows } = await pool.query(
    `SELECT id, imagepath, imagepath_medium
       FROM public.usergallery
      WHERE watermarked = false
      ORDER BY id`
  );

  console.log(`Found ${rows.length} gallery row(s) to watermark.`);
  let done = 0, failed = 0;

  for (const row of rows) {
    try {
      // original at q85, medium at q80 (matches upload pipeline); thumb untouched.
      await watermarkFileInPlace(row.imagepath, 85);
      await watermarkFileInPlace(row.imagepath_medium, 80);
      await pool.query(`UPDATE public.usergallery SET watermarked = true WHERE id = $1`, [row.id]);
      done++;
      console.log(`  ✓ id=${row.id}`);
    } catch (e) {
      failed++;
      console.error(`  ✗ id=${row.id}: ${e.message}`);
    }
  }

  console.log(`Done. watermarked=${done}, failed=${failed}.`);
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error('watermarkExisting failed:', e.message);
  try { await pool.end(); } catch (_) {}
  process.exit(1);
});
