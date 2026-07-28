// Pattern generation logic for the mitten knit-pattern grid.
// Ported from the original vanilla-JS implementation into a set of pure
// functions that operate on a supplied 2D canvas context.

/** Pixel size of a single knit stitch on the canvas. */
export const STITCH_SIZE = 10;

/** Blank margin (px) reserved around the grid for the stitch/row number labels. */
export const LABEL_MARGIN = 24;

export interface MittenSettings {
  /** Number of stitches across (canvas width in stitches). */
  stitches: number;
  /** Number of rows down (canvas height in stitches). */
  rows: number;
  /** Horizontal image offset, in stitches (-100–100). */
  offsetX: number;
  /** Vertical image offset, in stitches (-100–100). */
  offsetY: number;
  /** Image scale as a percentage (0–200). */
  size: number;
  /** Image rotation in degrees (-180–180). */
  rotation: number;
  /** Brightness adjustment applied before thresholding (-200–200). */
  brightness: number;
  /** Width of detected edges, in stitches (0 = edge detection off). */
  edgeThickness: number;
  /** Edge-detection sensitivity (0–100); higher finds weaker/noisier edges. */
  edgeSensitivity: number;
  /**
   * Number of colours in the extracted palette (2–10). The image is reduced to
   * its {@link extractPalette} most-representative colours and every block is
   * mapped to the nearest one, instead of the old black/white(/grey) greyscale.
   */
  numColors: number;
}

/** An sRGB colour as a `[r, g, b]` triple, each channel 0–255. */
export type RGB = [number, number, number];

/**
 * Manual stitch edits drawn by the user on top of the image-derived pattern.
 * Keyed by {@link overrideKey}; the value is the stitch's CSS colour (see
 * {@link INK_COLORS}). Overrides are applied after the image render, so a
 * hand-drawn stitch always wins over whatever the image produced there and
 * survives changes to the image controls.
 */
export type PatternOverrides = Map<string, string>;

/** Stable map key for a stitch at grid column `col`, row `row`. */
export const overrideKey = (col: number, row: number): string => `${col},${row}`;

/**
 * A rectangular block of stitches, given as inclusive grid-cell bounds with
 * `c0 <= c1` and `r0 <= r1`. Used by the selection tool to mark, copy and move a
 * region; drawn as a dashed marquee by {@link drawPattern}.
 */
export interface SelectionRect {
  c0: number;
  r0: number;
  c1: number;
  r1: number;
}

/** CSS colour string for an {@link RGB} triple, in the canonical form used as a
 *  {@link ColorRemap} key (matches the swatch strings offered in the draw tools). */
export const rgbCss = ([r, g, b]: RGB): string => `rgb(${r}, ${g}, ${b})`;

/**
 * Colour reassignments made in the toolbar's "reassign colours" mode. Maps an
 * original canvas colour (a palette entry's {@link rgbCss} or an override's CSS
 * string) to the colour it should be drawn as instead. Applied at render time to
 * both the image-derived fills and the hand-drawn overrides, so recolouring never
 * disturbs the palette used to quantise the image.
 */
export type ColorRemap = Map<string, string>;

/**
 * CSS colour a drawing tool stamps into an override. `white` doubles as the
 * eraser — it paints the background colour back over a stitch. The first three
 * are the pattern tones; the rest are common web colours for freehand drawing.
 */
export const INK_COLORS = {
  // Tones — the pattern base colours (grey is the optional 3rd tone).
  black: "black",
  grey: "grey",
  white: "white",
  // Reds
  crimson: "crimson",
  red: "red",
  coral: "coral",
  // Oranges & yellows
  orange: "orange",
  gold: "gold",
  yellow: "yellow",
  // Greens
  olive: "olive",
  green: "green",
  lime: "limegreen",
  // Teals & cyans
  teal: "teal",
  cyan: "darkcyan",
  aqua: "aqua",
  // Blues
  skyblue: "skyblue",
  royalblue: "royalblue",
  blue: "blue",
  navy: "navy",
  // Purples
  indigo: "indigo",
  purple: "purple",
  violet: "violet",
  // Pinks & magentas
  magenta: "magenta",
  hotpink: "hotpink",
  pink: "pink",
  // Browns
  brown: "saddlebrown",
  tan: "tan",
} as const;

/** A drawing tool, i.e. any paint colour in {@link INK_COLORS}. */
export type Tool = keyof typeof INK_COLORS;

export const defaultSettings: MittenSettings = {
  stitches: 100,
  rows: 50,
  offsetX: 0,
  offsetY: 0,
  size: 100,
  rotation: 0,
  brightness: 0,
  edgeThickness: 0,
  edgeSensitivity: 50,
  numColors: 3,
};

interface DerivedDimensions {
  width: number;
  height: number;
  offsetXpx: number;
  offsetYpx: number;
}

function derive(settings: MittenSettings): DerivedDimensions {
  return {
    width: STITCH_SIZE * settings.stitches,
    height: STITCH_SIZE * settings.rows,
    offsetXpx: settings.offsetX * STITCH_SIZE,
    offsetYpx: settings.offsetY * STITCH_SIZE,
  };
}

function drawSingleStitch(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fill = false,
): void {
  context.lineWidth = 0.25;
  context.fillStyle = "rgba(0,0,0,0)";

  if (fill) {
    context.fillStyle = "white";
    context.fillRect(x, y, size, size);
  } else {
    context.strokeStyle = "red";
    context.strokeRect(x, y, size, size);
  }
}

function drawStitchGrid(
  context: CanvasRenderingContext2D,
  settings: MittenSettings,
  dims: DerivedDimensions,
): void {
  const size = STITCH_SIZE;
  const { width } = dims;

  const totalStitches = Math.ceil(settings.stitches * settings.rows);

  Array(totalStitches)
    .fill(0)
    .forEach((_, i) => {
      const stitchX = (i * size) % width;
      const rowY = size * Math.floor((i * size) / width);

      drawSingleStitch(context, LABEL_MARGIN + stitchX, LABEL_MARGIN + rowY, size);
    });
}

function drawFacilityGrid(
  context: CanvasRenderingContext2D,
  settings: MittenSettings,
): void {
  const size = STITCH_SIZE;
  context.lineWidth = 0.8;
  context.strokeStyle = "black";

  const gridHeight = settings.rows * size;
  const gridWidth = settings.stitches * size;

  // Vertical grid lines every five stitches (excluding the first).
  Array(Math.ceil(settings.stitches / 5))
    .fill(0)
    .forEach((_, i) => {
      if (i === 0) return;
      const x = LABEL_MARGIN + size * i * 5;
      context.beginPath();
      context.moveTo(x, LABEL_MARGIN);
      context.lineTo(x, LABEL_MARGIN + gridHeight);
      context.stroke();
    });

  // Horizontal grid lines every five rows (excluding the first).
  Array(Math.ceil(settings.rows / 5))
    .fill(0)
    .forEach((_, i) => {
      if (i === 0) return;
      const y = LABEL_MARGIN + size * i * 5;
      context.beginPath();
      context.moveTo(LABEL_MARGIN, y);
      context.lineTo(LABEL_MARGIN + gridWidth, y);
      context.stroke();
    });
}

function drawGridLabels(
  context: CanvasRenderingContext2D,
  settings: MittenSettings,
): void {
  const size = STITCH_SIZE;
  context.fillStyle = "black";
  context.font = "10px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Stitch numbers across the top.
  for (let n = 0; n <= settings.stitches; n += 5) {
    context.fillText(String(n), LABEL_MARGIN + n * size, LABEL_MARGIN / 2);
  }

  // Row numbers down the left side, counting up from the bottom.
  for (let n = 0; n <= settings.rows; n += 5) {
    context.fillText(
      String(n),
      LABEL_MARGIN / 2,
      LABEL_MARGIN + (settings.rows - n) * size,
    );
  }
}

// Detect edges directly from the continuous (pre-threshold) luminance with a
// Sobel operator, then stamp them into the stitch grid as ink.
//
// Working on the smooth source luminance rather than the already-quantised
// black/white grid is the whole point: it recovers outlines that thresholding
// flattened away, so lines come out continuous even where the thresholded
// pattern is broken or sparse.
//
// Detected edges are thinned to a single stitch by non-maximum suppression
// before drawing, so `thickness` is a true line width rather than a side effect
// of the kernel's spread.
//
// `sensitivity` (0–100) sets how weak an edge still counts — higher detects
// more (and noisier) edges. `thickness` (1–3) sets the drawn line width:
// thinned edges are dilated by `thickness − 1` stitches. Edges are collected
// before any mutation so the dilation can't cascade.
function detectEdges(
  pal: Int16Array,
  alpha: Uint8Array,
  lum: Int16Array,
  cols: number,
  rows: number,
  inkIndex: number,
  thickness: number,
  sensitivity: number,
): void {
  // Map sensitivity to a Sobel-magnitude threshold. A clean black↔white step
  // edge scores ~3060 (4 × 765 luminance); the 0–2000 span keeps the middle of
  // the slider in the useful range.
  const threshold = ((100 - sensitivity) / 100) * 2000;

  // Sample luminance, clamping to the border so edge rows/cols stay in bounds.
  const at = (cx: number, cy: number): number => {
    const x = cx < 0 ? 0 : cx >= cols ? cols - 1 : cx;
    const y = cy < 0 ? 0 : cy >= rows ? rows - 1 : cy;
    return lum[y * cols + x];
  };

  // Pass 1: Sobel gradient components and magnitude for every stitch.
  const gxArr = new Int32Array(cols * rows);
  const gyArr = new Int32Array(cols * rows);
  const mag = new Int32Array(cols * rows);
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const gx =
        -at(cx - 1, cy - 1) - 2 * at(cx - 1, cy) - at(cx - 1, cy + 1) +
        at(cx + 1, cy - 1) + 2 * at(cx + 1, cy) + at(cx + 1, cy + 1);
      const gy =
        -at(cx - 1, cy - 1) - 2 * at(cx, cy - 1) - at(cx + 1, cy - 1) +
        at(cx - 1, cy + 1) + 2 * at(cx, cy + 1) + at(cx + 1, cy + 1);
      const idx = cy * cols + cx;
      gxArr[idx] = gx;
      gyArr[idx] = gy;
      mag[idx] = Math.abs(gx) + Math.abs(gy);
    }
  }

  const magAt = (cx: number, cy: number): number =>
    cx < 0 || cy < 0 || cx >= cols || cy >= rows ? 0 : mag[cy * cols + cx];

  // Pass 2: non-maximum suppression. The 3×3 Sobel kernel responds on every
  // stitch it overlaps, so a single hard transition lights up 2–3 stitches
  // across. Keeping only the local maximum along the gradient direction thins
  // each edge to a single stitch; `thickness` then dilates from there.
  const edges: number[] = [];
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const idx = cy * cols + cx;
      const m = mag[idx];
      if (m <= threshold) continue;

      // Compare against the two neighbours straddling the edge, picked from the
      // gradient direction quantised to one of four orientations (±22.5°).
      const ax = Math.abs(gxArr[idx]);
      const ay = Math.abs(gyArr[idx]);
      let m1: number;
      let m2: number;
      if (ax > ay * 2.414) {
        // Gradient ~horizontal → edge runs vertically.
        m1 = magAt(cx - 1, cy);
        m2 = magAt(cx + 1, cy);
      } else if (ay > ax * 2.414) {
        // Gradient ~vertical → edge runs horizontally.
        m1 = magAt(cx, cy - 1);
        m2 = magAt(cx, cy + 1);
      } else if (gxArr[idx] > 0 === gyArr[idx] > 0) {
        // Gradient along the ↘ diagonal.
        m1 = magAt(cx - 1, cy - 1);
        m2 = magAt(cx + 1, cy + 1);
      } else {
        // Gradient along the ↗ diagonal.
        m1 = magAt(cx + 1, cy - 1);
        m2 = magAt(cx - 1, cy + 1);
      }

      // Keep only ridge peaks. The asymmetric >=/> comparison breaks ties so an
      // exactly-flat two-stitch ridge still collapses to one.
      if (m >= m1 && m > m2) {
        edges.push(idx);
      }
    }
  }

  // Stamp each detected edge into the grid as ink, dilated to the line width.
  // The structuring element is a diamond (|dx| + |dy| ≤ radius), not a square:
  // a square kernel stamps a (2r+1)² block, which makes diagonal runs come out
  // ~√2× thicker than axis-aligned ones. The diamond keeps the drawn width even
  // across orientations.
  const radius = thickness - 1;
  for (const edge of edges) {
    const ex = edge % cols;
    const ey = Math.floor(edge / cols);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > radius) continue;
        const nx = ex + dx;
        const ny = ey + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const idx = ny * cols + nx;
        pal[idx] = inkIndex;
        alpha[idx] = 1;
      }
    }
  }
}

// Perceptual (Rec. 601) luminance of an sRGB pixel, scaled to the 0–765 range
// used throughout so the existing thresholds and brightness offset stay valid.
// A plain r+g+b sum weights the channels equally, which makes blues read too
// light and greens too dark relative to how the eye perceives brightness; these
// coefficients (0.299/0.587/0.114, ×3 so white still maps to 765) track it.
function luma765(r: number, g: number, b: number): number {
  return 0.897 * r + 1.761 * g + 0.342 * b;
}

// Index of the palette colour closest to (r, g, b) by squared Euclidean distance
// in RGB. Squared distance is monotonic in distance, so skipping the sqrt gives
// the same winner far more cheaply — this runs once per stitch on every redraw.
function nearestPaletteIndex(palette: RGB[], r: number, g: number, b: number): number {
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

// Draw the (optional) source image, then pixelate it and map each block to the
// nearest colour in the extracted `palette`, producing a knit-friendly grid.
function renderImage(
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

// Paint the user's hand-drawn stitches over the image-derived grid. Runs before
// the grid lines are stroked so those stay visible on top of a filled stitch.
// Overrides outside the current stitch/row bounds are ignored (not deleted), so
// shrinking then re-growing the grid brings earlier edits back.
function drawOverrides(
  context: CanvasRenderingContext2D,
  settings: MittenSettings,
  overrides: PatternOverrides,
  colorRemap: ColorRemap,
): void {
  const size = STITCH_SIZE;
  overrides.forEach((color, key) => {
    const [col, row] = key.split(",").map(Number);
    if (col < 0 || row < 0 || col >= settings.stitches || row >= settings.rows) {
      return;
    }
    context.fillStyle = colorRemap.get(color) ?? color;
    context.fillRect(
      LABEL_MARGIN + col * size,
      LABEL_MARGIN + row * size,
      size,
      size,
    );
  });
}

// Stroke a dashed rectangle around the selected block of stitches, drawn last so
// it sits above the pattern and grid. Bounds are inclusive cells, so the width
// spans `c1 - c0 + 1` stitches.
function drawSelectionOutline(
  context: CanvasRenderingContext2D,
  selection: SelectionRect,
): void {
  const size = STITCH_SIZE;
  const x = LABEL_MARGIN + selection.c0 * size;
  const y = LABEL_MARGIN + selection.r0 * size;
  const w = (selection.c1 - selection.c0 + 1) * size;
  const h = (selection.r1 - selection.r0 + 1) * size;
  context.save();
  context.setLineDash([6, 4]);
  context.lineWidth = 2;
  context.strokeStyle = "rgb(214, 40, 40)";
  context.strokeRect(x, y, w, h);
  context.restore();
}

/**
 * Render the full pattern (optional image + hand-drawn edits + grid) onto the
 * supplied canvas. Resizes the canvas to match the current stitch/row count.
 * `colorRemap` recolours matching palette/override colours at draw time (see
 * {@link ColorRemap}). When `selection` is given, a dashed marquee is drawn
 * around that block of stitches on top of everything else.
 */
export function drawPattern(
  canvas: HTMLCanvasElement,
  settings: MittenSettings,
  img?: HTMLImageElement | null,
  overrides?: PatternOverrides,
  palette: RGB[] = [],
  colorRemap: ColorRemap = new Map(),
  selection: SelectionRect | null = null,
): void {
  const context = canvas.getContext("2d");
  if (!context) return;

  const dims = derive(settings);

  canvas.width = dims.width + LABEL_MARGIN;
  canvas.height = dims.height + LABEL_MARGIN;
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (img) renderImage(context, img, settings, dims, palette, colorRemap);
  if (overrides && overrides.size > 0)
    drawOverrides(context, settings, overrides, colorRemap);
  drawStitchGrid(context, settings, dims);
  drawFacilityGrid(context, settings);
  drawGridLabels(context, settings);
  if (selection) drawSelectionOutline(context, selection);
}
