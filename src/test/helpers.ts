// Shared fixtures and factories for the test suites.

import type { PointerEvent } from "react";
import { vi } from "vitest";
import { defaultSettings, type MittenSettings } from "../lib/patternGenerator";
import { LABEL_MARGIN, STITCH_SIZE } from "../lib/patternGenerator";
import type { CanvasPointerEvent } from "../interactions/types";

/** A settings object with overrides merged over the defaults. */
export function makeSettings(overrides: Partial<MittenSettings> = {}): MittenSettings {
  return { ...defaultSettings, ...overrides };
}

/**
 * A canvas element pre-sized so that {@link cellFromPoint} maps client
 * coordinates to grid cells 1:1 (canvas scale of 1, no bounding-rect offset).
 * `getBoundingClientRect` is stubbed because jsdom reports zero size.
 */
export function makeCanvas(width = 400, height = 400): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getBoundingClientRect = vi.fn(
    () =>
      ({
        left: 0,
        top: 0,
        width,
        height,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
  );
  canvas.setPointerCapture = vi.fn();
  canvas.releasePointerCapture = vi.fn();
  return canvas;
}

/** Client x for the centre of grid column `col` on a scale-1 canvas. */
export const clientX = (col: number): number =>
  LABEL_MARGIN + col * STITCH_SIZE + STITCH_SIZE / 2;

/** Client y for the centre of grid row `row` on a scale-1 canvas. */
export const clientY = (row: number): number =>
  LABEL_MARGIN + row * STITCH_SIZE + STITCH_SIZE / 2;

/** A synthetic React pointer event carrying the fields the interactions read. */
export function pointerEvent(
  canvas: HTMLCanvasElement,
  fields: { pointerId?: number; clientX?: number; clientY?: number } = {},
): CanvasPointerEvent {
  return {
    currentTarget: canvas,
    pointerId: fields.pointerId ?? 1,
    clientX: fields.clientX ?? 0,
    clientY: fields.clientY ?? 0,
  } as unknown as PointerEvent<HTMLCanvasElement>;
}
