// Render the source image into the stitch grid: draw it, pixelate each block,
// map to the nearest palette colour, and optionally stamp detected edges.

import { LABEL_MARGIN, STITCH_SIZE } from "../config/pattern";
import type { ColorRemap, MittenSettings, RGB } from "../types/pattern";
import { detectEdges } from "./edgeDetection";
import { luma765, nearestPaletteIndex } from "./palette";
import type { DerivedDimensions } from "./patternGrid";
import { rgbCss } from "./patternKeys";

// Draw the (optional) source image, then pixelate it and map each block to the
// nearest colour in the extracted `palette`, producing a knit-friendly grid.
export function renderImage(
  context: CanvasRenderingContext2D,
  img: HTMLImageElement,
  settings: MittenSettings,
  dims: DerivedDimensions,
  palette: RGB[],
  colorRemap: ColorRemap,
): void {
  if (palette.length === 0) return;
  const { width, height, offsetXpx, offsetYpx } = dims;

  const scaleFactor = settings.size / 100;
  const drawWidth = scaleFactor * img.width;
  const drawHeight = scaleFactor * img.height;
  const drawX = LABEL_MARGIN + offsetXpx;
  // Anchor the image centred in the grid; offsetY nudges it from there. (The
  // base offset is a true vertical quantity — half the leftover height — rather
  // than the old horizontal stitch count, which shifted placement whenever the
  // stitch count changed.)
  const drawY = LABEL_MARGIN + offsetYpx + (height - drawHeight) / 2;

  // Clip to the grid rectangle so any part of the image that falls outside it —
  // above/left in the label margin, or past the right/bottom edge — is never
  // painted. Otherwise those raw (un-pixelated) image edges survive the
  // clearRect below, which only wipes the grid region, and bleed onto the canvas.
  context.save();
  context.beginPath();
  context.rect(LABEL_MARGIN, LABEL_MARGIN, width, height);
  context.clip();

  if (settings.rotation) {
    // Rotate around the centre of the drawn image so the offset/scale controls
    // still position the same anchor point regardless of angle.
    const centreX = drawX + drawWidth / 2;
    const centreY = drawY + drawHeight / 2;
    context.save();
    context.translate(centreX, centreY);
    context.rotate((settings.rotation * Math.PI) / 180);
    context.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.restore();
  } else {
    context.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  context.restore();

  const pixelationFactor = STITCH_SIZE;
  const originalImageData = context.getImageData(
    LABEL_MARGIN,
    LABEL_MARGIN,
    width,
    height,
  ).data;

  // Wipe the raw image (including its anti-aliased edges) before repainting the
  // pixelated blocks — otherwise the semi-transparent block fills composite over
  // the original edge pixels and leave a coloured fringe showing through.
  context.clearRect(LABEL_MARGIN, LABEL_MARGIN, width, height);

  // First pass: sample each block into a stitch grid. `rSrc/gSrc/bSrc` hold the
  // continuous block colour (mapped to a `pal` palette index afterwards) and
  // `alpha` its coverage; `lum` keeps a separate luminance so edge detection can
  // find outlines the palette mapping would flatten.
  const cols = Math.ceil(width / pixelationFactor);
  const rows = Math.ceil(height / pixelationFactor);
  const pal = new Int16Array(cols * rows);
  const alpha = new Uint8Array(cols * rows);
  const lum = new Int16Array(cols * rows);
  // Continuous brightness-adjusted colour (0–255 per channel) per block,
  // kept separate from the quantised `pal` so the mapping step can work from it.
  const rSrc = new Float32Array(cols * rows);
  const gSrc = new Float32Array(cols * rows);
  const bSrc = new Float32Array(cols * rows);

  const blockPixels = pixelationFactor * pixelationFactor;

  // Brightness slider spans the 0–765 luminance domain; scale to a per-channel
  // 0–255 offset so its feel is unchanged.
  const brightness = settings.brightness / 3;
  const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      // Average the whole block rather than point-sampling one pixel. A single
      // noisy or anti-aliased pixel shouldn't decide an entire stitch, and a
      // sub-stitch offset nudge shouldn't flip the result. Two accumulators run:
      //   • lumSum          — every pixel, transparent read as white (765). Feeds
      //                       edge detection, so the subject's silhouette still
      //                       registers as an edge against the empty background.
      //   • r/g/bSum        — opaque pixels only, so transparent padding can't
      //                       wash out the colour of a partially-covered block.
      let lumSum = 0;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let opaqueCount = 0;
      for (let py = 0; py < pixelationFactor; py++) {
        for (let px = 0; px < pixelationFactor; px++) {
          const p =
            (cx * pixelationFactor + px + (cy * pixelationFactor + py) * width) * 4;
          if (originalImageData[p + 3] > 127) {
            const r = originalImageData[p];
            const g = originalImageData[p + 1];
            const b = originalImageData[p + 2];
            rSum += r;
            gSum += g;
            bSum += b;
            lumSum += luma765(r, g, b);
            opaqueCount++;
          } else {
            lumSum += 765;
          }
        }
      }

      const idx = cy * cols + cx;

      // Block colour per channel (0–255), brightened. An empty block is left
      // black, but it's transparent below so the colour is unused.
      const n = opaqueCount > 0 ? opaqueCount : 1;
      rSrc[idx] = clamp255(rSum / n + brightness);
      gSrc[idx] = clamp255(gSum / n + brightness);
      bSrc[idx] = clamp255(bSum / n + brightness);

      // Ink the stitch only if most of its block is opaque — the block analog of
      // the old top-left alpha test, without the point-sampling aliasing.
      alpha[idx] = opaqueCount * 2 > blockPixels ? 1 : 0;

      // Edge-detection luminance (see lumSum above). Brightness is omitted: a
      // constant offset cancels in a gradient.
      lum[idx] = lumSum / blockPixels;
    }
  }

  // Map each block's colour to the nearest palette entry.
  for (let idx = 0; idx < pal.length; idx++) {
    pal[idx] = nearestPaletteIndex(palette, rSrc[idx], gSrc[idx], bSrc[idx]);
  }

  // Optional transform: detect the image's edges and draw them as ink. The ink
  // colour is the darkest palette entry (palette[0], sorted darkest→lightest).
  if (settings.edgeThickness > 0) {
    detectEdges(
      pal,
      alpha,
      lum,
      cols,
      rows,
      0,
      settings.edgeThickness,
      settings.edgeSensitivity,
    );
  }

  // Second pass: paint the (possibly transformed) grid, one solid square per stitch.
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const idx = cy * cols + cx;
      const [r, g, b] = palette[pal[idx]];
      // Recolour via any reassignment for this palette colour. Only opaque
      // stitches take the mapped (fully-opaque) colour; transparent ones stay
      // transparent so empty blocks show the background.
      const mapped = alpha[idx] === 1 ? colorRemap.get(rgbCss(palette[pal[idx]])) : undefined;
      context.fillStyle = mapped ?? `rgba(${r}, ${g}, ${b}, ${alpha[idx]})`;
      context.fillRect(
        LABEL_MARGIN + cx * pixelationFactor,
        LABEL_MARGIN + cy * pixelationFactor,
        pixelationFactor,
        pixelationFactor,
      );
    }
  }
}
