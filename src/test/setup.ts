import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { installCanvasMock } from "./canvas";

// jsdom has no canvas; install the mock before every test so each gets fresh
// per-canvas state, and unmount any rendered components afterwards.
beforeEach(() => {
  installCanvasMock();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
