#!/usr/bin/env node
// Generates the OG image (1200x630) for the Ligeon landing page.
// Uses SVG overlays for text since sharp has no native text support.
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const LOGO_PATH = path.join(root, 'resources/icons/png/icon.png');
const SCREENSHOT_PATH = path.join(root, 'site/_site/ligeon-screen.png');
const OUTPUT_PATH = path.join(root, 'site/_site/og-image.png');

const W = 1200;
const H = 630;

// Panel dimensions
const LEFT_W = 480;
const RIGHT_W = W - LEFT_W; // 720
const SCREENSHOT_PADDING = 20;

// Brand colours
const BG = '#0f0f0f';
const TEXT_MAIN = '#f5f0e8';
const TEXT_SUB = '#a89f8f';

async function buildLeftPanelSvg() {
  // Logo placeholder dimensions (logo is composited separately as a raster)
  const logoSize = 80;
  const logoCenterX = LEFT_W / 2;
  // Upper-third: logo top at ~150px, centered in left panel
  const logoTop = 150;
  // Text positioned below logo
  const titleY = logoTop + logoSize + 54; // ~284
  const subtitleY = titleY + 40;          // ~324
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LEFT_W}" height="${H}">
    <!-- "Ligeon" title -->
    <text
      x="${logoCenterX}" y="${titleY}"
      font-family="'Helvetica Neue', Arial, sans-serif"
      font-weight="700"
      font-size="48"
      letter-spacing="2"
      fill="${TEXT_MAIN}"
      text-anchor="middle"
      dominant-baseline="auto"
    >Ligeon</text>

    <!-- Subtitle -->
    <text
      x="${logoCenterX}" y="${subtitleY}"
      font-family="'Helvetica Neue', Arial, sans-serif"
      font-weight="400"
      font-size="20"
      letter-spacing="1"
      fill="${TEXT_SUB}"
      text-anchor="middle"
      dominant-baseline="auto"
    >Chess Game Browser</text>
  </svg>`;

  return { svg: Buffer.from(svg), logoCenterX, logoTop, logoSize };
}

async function buildScreenshotWithRoundedCorners(screenshotPath, fitW, fitH) {
  // Resize screenshot to fit within the right panel (with padding), then apply
  // rounded corners via a clipping mask composited as an alpha channel.
  const radius = 8;

  // Resize to a PNG buffer first so we know the exact output dimensions
  const { data: resizedBuf, info: resizedInfo } = await sharp(screenshotPath)
    .resize(fitW, fitH, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: sw, height: sh } = resizedInfo;

  // SVG rounded-rect mask — composited as dest-in to clip alpha
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}">
      <rect width="${sw}" height="${sh}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`
  );

  // Re-wrap raw RGBA buffer, apply mask, output PNG
  const pngBuf = await sharp(resizedBuf, { raw: { width: sw, height: sh, channels: 4 } })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return { buffer: pngBuf, width: sw, height: sh };
}

async function main() {
  // 1. Dark background canvas
  const background = await sharp({
    create: { width: W, height: H, channels: 3, background: BG },
  }).png().toBuffer();

  // 2. Build left panel SVG overlay (text + gold accent)
  const { svg: leftSvg, logoCenterX, logoTop, logoSize } = await buildLeftPanelSvg();

  // 3. Resize logo
  const logoBuffer = await sharp(LOGO_PATH)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 15, g: 15, b: 15, alpha: 1 } })
    .png()
    .toBuffer();

  // 4. Prepare screenshot with rounded corners
  const fitW = RIGHT_W - SCREENSHOT_PADDING * 2;
  const fitH = H - SCREENSHOT_PADDING * 2;
  const { buffer: screenshotBuf, width: sw, height: sh } =
    await buildScreenshotWithRoundedCorners(SCREENSHOT_PATH, fitW, fitH);

  // Centre the screenshot within the right panel
  const screenshotLeft = LEFT_W + SCREENSHOT_PADDING + Math.floor((fitW - sw) / 2);
  const screenshotTop = SCREENSHOT_PADDING + Math.floor((fitH - sh) / 2);

  // 5. Composite everything onto background
  await sharp(background)
    .composite([
      // Left-panel SVG (text + gold dot)
      { input: leftSvg, left: 0, top: 0 },
      // Logo raster, centred horizontally in left panel
      {
        input: logoBuffer,
        left: Math.floor(logoCenterX - logoSize / 2),
        top: logoTop,
      },
      // Screenshot (right panel) — PNG buffer, no raw descriptor needed
      {
        input: screenshotBuf,
        left: screenshotLeft,
        top: screenshotTop,
      },
    ])
    .toFile(OUTPUT_PATH);

  console.log(`OG image written to ${OUTPUT_PATH} (${W}x${H})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
