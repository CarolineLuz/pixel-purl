// Colour analysis for the image-derived pattern: perceptual luminance, nearest-
// palette lookup, and median-cut palette extraction.

import type { RGB } from "../types/pattern";

// Perceptual (Rec. 601) luminance of an sRGB pixel, scaled to the 0–765 range
// used throughout so the existing thresholds and brightness offset stay valid.
// A plain r+g+b sum weights the channels equally, which makes blues read too
// light and greens too dark relative to how the eye perceives brightness; these
// coefficients (0.299/0.587/0.114, ×3 so white still maps to 765) track it.
export function luma765(r: number, g: number, b: number): number {
  return 0.897 * r + 1.761 * g + 0.342 * b;
}

// Index of the palette colour closest to (r, g, b) by squared Euclidean distance
// in RGB. Squared distance is monotonic in distance, so skipping the sqrt gives
// the same winner far more cheaply — this runs once per stitch on every redraw.
export function nearestPaletteIndex(palette: RGB[], r: number, g: number, b: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const dr = palette[i][0] - r;
    const dg = palette[i][1] - g;
    const db = palette[i][2] - b;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/**
 * Extract the {@link MittenSettings.numColors} most-representative colours from
 * an image using **median cut** — the classic deterministic colour-quantisation
 * used by GIF encoders. Deterministic means the same image + count always yields
 * the same palette, so repeated redraws never flicker between palettes.
 *
 * The image is drawn to an offscreen canvas downscaled to at most {@link SAMPLE_MAX}
 * px on its long edge (a few thousand samples describe the colour distribution
 * plenty well and keep this fast), then opaque pixels are recursively split into
 * boxes: each step takes the box with the widest single-channel spread and splits
 * it at the median along that channel. Each final box's average colour is one
 * palette entry. The palette is returned sorted darkest→lightest so `palette[0]`
 * is a stable "ink" colour for edge detection.
 *
 * Returns `[]` if the image has no readable opaque pixels.
 */
const SAMPLE_MAX = 128;

export function extractPalette(img: HTMLImageElement, numColors: number): RGB[] {
  const scale = Math.min(1, SAMPLE_MAX / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  // Collect opaque pixels as flat RGB samples.
  const samples: RGB[] = [];
  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3] > 127) samples.push([data[p], data[p + 1], data[p + 2]]);
  }
  if (samples.length === 0) return [];

  const target = Math.max(1, Math.min(numColors, samples.length));

  // Each box is a contiguous slice [start, end) of `samples`, reordered in place
  // as boxes are split. Start with one box spanning everything.
  interface Box {
    start: number;
    end: number;
  }
  const boxes: Box[] = [{ start: 0, end: samples.length }];

  // Widest colour channel of a box and the size of that spread, so we can pick
  // both which box to split next (largest spread) and along which axis.
  const spread = (box: Box): { channel: number; range: number } => {
    const min = [255, 255, 255];
    const max = [0, 0, 0];
    for (let i = box.start; i < box.end; i++) {
      for (let c = 0; c < 3; c++) {
        const v = samples[i][c];
        if (v < min[c]) min[c] = v;
        if (v > max[c]) max[c] = v;
      }
    }
    const ranges = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    const channel = ranges[0] >= ranges[1] && ranges[0] >= ranges[2] ? 0 : ranges[1] >= ranges[2] ? 1 : 2;
    return { channel, range: ranges[channel] };
  };

  while (boxes.length < target) {
    // Pick the splittable box (>1 sample) with the widest channel spread.
    let bestIdx = -1;
    let bestRange = -1;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].end - boxes[i].start < 2) continue;
      const { range } = spread(boxes[i]);
      if (range > bestRange) {
        bestRange = range;
        bestIdx = i;
      }
    }
    // No box can be split further (all singletons / uniform) — fewer distinct
    // colours than requested.
    if (bestIdx === -1 || bestRange === 0) break;

    const box = boxes[bestIdx];
    const { channel } = spread(box);
    // Sort the box's slice by the chosen channel and split at its median.
    const slice = samples.slice(box.start, box.end).sort((a, b) => a[channel] - b[channel]);
    for (let i = 0; i < slice.length; i++) samples[box.start + i] = slice[i];
    const mid = box.start + (slice.length >> 1);
    boxes.splice(bestIdx, 1, { start: box.start, end: mid }, { start: mid, end: box.end });
  }

  // Each box's average colour is a palette entry.
  const palette: RGB[] = boxes.map((box) => {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = box.start; i < box.end; i++) {
      r += samples[i][0];
      g += samples[i][1];
      b += samples[i][2];
    }
    const n = box.end - box.start;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });

  palette.sort((a, b) => luma765(a[0], a[1], a[2]) - luma765(b[0], b[1], b[2]));
  return palette;
}
