// Sobel edge detection for the image-derived pattern.

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
export function detectEdges(
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
