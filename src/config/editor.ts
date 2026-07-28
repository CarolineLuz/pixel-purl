// Tunable constants for the editor. Everything here is a policy decision (a
// limit, a tolerance, a filename) rather than logic, so it lives apart from the
// modules that apply it.

/** Offset range (in stitches) allowed for the image start point. */
export const OFFSET_MIN = -100;
export const OFFSET_MAX = 100;

/**
 * Per-channel tolerance when deciding whether two sampled canvas colours belong
 * to the same region (flood fill). Canvas fills are solid, so this only guards
 * against incidental rounding — alpha is compared too, which is what separates
 * empty/transparent cells from opaque black.
 */
export const COLOR_MATCH_TOLERANCE = 16;

/** Alpha byte at or above which a sampled cell counts as a real (opaque) stitch. */
export const OPAQUE_ALPHA = 128;

/** CSS colour a moved selection leaves behind. It is both the eraser colour and
 *  the page background, so an underlying image is hidden there too. */
export const ERASE_COLOR = "white";

/** Filename offered when exporting the pattern as a PNG image. */
export const EXPORT_FILENAME = "mitten-pattern.png";

/** Name of the re-importable project entry stored inside the exported zip. */
export const PROJECT_FILENAME = "mitten-pattern.pattern";

/** Filename offered when exporting the full project (PNG + project file zipped). */
export const PROJECT_ZIP_FILENAME = "mitten-pattern.zip";

/** File types the "import pattern" picker accepts: the zipped project, or a bare
 *  project file for anyone who unzipped it first. */
export const ACCEPTED_PROJECT_TYPES = ".zip,.pattern,application/zip,application/json";

/** Intrinsic canvas size before the first render; `drawPattern` resizes the
 *  canvas to the current stitch/row count on every draw. */
export const CANVAS_INITIAL_SIZE = 800;

/** Image types the file picker accepts. */
export const ACCEPTED_IMAGE_TYPES = "image/jpg, image/png, image/jpeg, image/webp";
