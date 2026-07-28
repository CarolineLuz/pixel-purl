import { useEffect, useState } from "react";
import { extractPalette, type RGB } from "../lib/patternGenerator";

/** A callback held in a ref, so the latest one is always the one that fires. */
type CallbackRef<T> = { current: (value: T) => void };

export interface ImageSource {
  image: HTMLImageElement | null;
  /** The source image as a data URL, or null when there is no image. Retained
   *  so the pattern can be exported and re-imported later. */
  dataUrl: string | null;
  /** The image's colour palette, or `[]` when there is no image. */
  palette: RGB[];
  /** Load a picked file, or clear the image when passed null. */
  load(file: File | null): void;
  /** Restore an image from a data URL when importing a saved pattern. Unlike
   *  {@link load} this does *not* run the new-image reset (`onLoaded`), because
   *  the importer is restoring the drawing and settings itself. */
  restore(dataUrl: string | null): void;
}

/**
 * The uploaded image and the palette derived from it.
 *
 * `onLoaded` is held in a ref rather than taken as a plain argument because it
 * fires from the image's async `onload`, and the editor's reset for a new image
 * has to reach state slices that are created after this hook.
 */
export function useImageSource(
  numColors: number,
  onLoaded: CallbackRef<HTMLImageElement>,
): ImageSource {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<RGB[]>([]);

  // Recompute the palette only when the image or the requested colour count
  // changes — the extraction scans every pixel, so it must stay out of the
  // per-frame redraw that fires on every offset/rotation nudge.
  useEffect(() => {
    setPalette(image ? extractPalette(image, numColors) : []);
  }, [image, numColors]);

  // Decode a data URL into an <img>, then hand it to `after`. A data URL (rather
  // than an object URL) is used so the same string can be stored and re-exported.
  const decode = (url: string, after: (img: HTMLImageElement) => void) => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setDataUrl(url);
      after(img);
    };
    img.src = url;
  };

  const load = (file: File | null) => {
    if (!file) {
      setImage(null);
      setDataUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => decode(reader.result as string, (img) => onLoaded.current(img));
    reader.readAsDataURL(file);
  };

  const restore = (url: string | null) => {
    if (!url) {
      setImage(null);
      setDataUrl(null);
      return;
    }
    decode(url, () => {});
  };

  return { image, dataUrl, palette, load, restore };
}
