#!/usr/bin/env node
// Generates DMG installer background images for the Ligeon app.
// Outputs resources/background.png (540x400) and resources/background@2x.png (1080x800).
// Run standalone: node scripts/generate-dmg-background.js

import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const resourcesDir = join(__dirname, "..", "resources");

mkdirSync(resourcesDir, { recursive: true });

const ARROW_COLOR = "#aaaaaa";
const TEXT_COLOR = "#aaaaaa";

/**
 * Draw the DMG background onto a canvas at the given scale.
 * All layout coordinates are in 1x units; scale multiplies them.
 *
 * @param {number} scale - 1 for 1x (540×380), 2 for 2x (1080×760)
 */
function drawBackground(scale) {
  const W = 540 * scale;
  const H = 400 * scale;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Icon row: app icon at x=130, Applications folder at x=410, y=150 (1x coords)
  const iconY = 160 * scale;
  const appX = 130 * scale;
  const appsX = 410 * scale;

  // Arrow between the two icon positions, centered horizontally
  const arrowCenterX = (appX + appsX) / 2;
  const arrowHalfWidth = 30 * scale;
  const arrowHeadSize = 14 * scale;
  const arrowY = iconY;

  ctx.strokeStyle = ARROW_COLOR;
  ctx.fillStyle = ARROW_COLOR;
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = "round";

  // Shaft
  ctx.beginPath();
  ctx.moveTo(arrowCenterX - arrowHalfWidth, arrowY);
  ctx.lineTo(arrowCenterX + arrowHalfWidth - arrowHeadSize * 0.6, arrowY);
  ctx.stroke();

  // Arrowhead (filled triangle pointing right)
  ctx.beginPath();
  ctx.moveTo(arrowCenterX + arrowHalfWidth, arrowY);
  ctx.lineTo(arrowCenterX + arrowHalfWidth - arrowHeadSize, arrowY - arrowHeadSize * 0.5);
  ctx.lineTo(arrowCenterX + arrowHalfWidth - arrowHeadSize, arrowY + arrowHeadSize * 0.5);
  ctx.closePath();
  ctx.fill();

  // Instruction text centered horizontally at y=300 (1x coords)
  const fontSize = 14 * scale;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Drag to Applications to install", W / 2, 310 * scale);

  return canvas;
}

const canvas1x = drawBackground(1);
writeFileSync(join(resourcesDir, "background.png"), canvas1x.toBuffer("image/png"));
console.log("Wrote resources/background.png (540x400)");

const canvas2x = drawBackground(2);
writeFileSync(join(resourcesDir, "background@2x.png"), canvas2x.toBuffer("image/png"));
console.log("Wrote resources/background@2x.png (1080x800)");
