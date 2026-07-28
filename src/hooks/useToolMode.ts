import { useMemo, useReducer } from "react";
import type { FillMode, ToolMode } from "../types/editor";

/**
 * Which tool is active, plus the draw tool's sub-modes and dialogs. Holding all
 * of it in one reducer is what makes the toolbars mutually exclusive by
 * construction: every mode change goes through {@link reduce}, which resets the
 * sub-modes, instead of each toggle handler remembering to clear the others.
 */
export interface ToolModeState {
  mode: ToolMode;
  fillMode: FillMode;
  /** Whether the "reassign colours" sub-mode of drawing is active. */
  reassignMode: boolean;
  /** The canvas colour currently being overwritten (its picker modal is open),
   *  or null when the modal is closed. */
  reassignFrom: string | null;
  /** Whether the "select colour" modal (adding a brand-new paint colour) is open. */
  colorPickerOpen: boolean;
}

type ToolModeAction =
  | { type: "toggleMode"; mode: Exclude<ToolMode, "pan"> }
  | { type: "toggleReassign" }
  | { type: "toggleFill"; fill: Exclude<FillMode, "off"> }
  | { type: "startReassign"; from: string }
  | { type: "cancelReassign" }
  | { type: "setColorPicker"; open: boolean };

const initialState: ToolModeState = {
  mode: "pan",
  fillMode: "off",
  reassignMode: false,
  reassignFrom: null,
  colorPickerOpen: false,
};

/** Every sub-mode and dialog at rest. Any tool change starts from here. */
const subModesIdle = {
  fillMode: "off",
  reassignMode: false,
  reassignFrom: null,
  colorPickerOpen: false,
} satisfies Omit<ToolModeState, "mode">;

function reduce(state: ToolModeState, action: ToolModeAction): ToolModeState {
  switch (action.type) {
    case "toggleMode":
      // Selecting the active tool again returns to plain panning.
      return {
        ...subModesIdle,
        mode: state.mode === action.mode ? "pan" : action.mode,
      };
    case "toggleReassign":
      return state.reassignMode
        ? { ...state, reassignMode: false, reassignFrom: null }
        : {
            ...state,
            reassignMode: true,
            // Reassigning and filling are mutually exclusive sub-modes.
            fillMode: "off",
            colorPickerOpen: false,
          };
    case "toggleFill":
      return {
        ...state,
        fillMode: state.fillMode === action.fill ? "off" : action.fill,
        reassignMode: false,
        reassignFrom: null,
      };
    case "startReassign":
      return { ...state, reassignFrom: action.from };
    case "cancelReassign":
      return { ...state, reassignFrom: null };
    case "setColorPicker":
      return { ...state, colorPickerOpen: action.open };
  }
}

export interface ToolModeActions {
  toggleMode(mode: Exclude<ToolMode, "pan">): void;
  toggleReassign(): void;
  toggleFill(fill: Exclude<FillMode, "off">): void;
  startReassign(from: string): void;
  cancelReassign(): void;
  openColorPicker(): void;
  closeColorPicker(): void;
}

export function useToolMode(): [ToolModeState, ToolModeActions] {
  const [state, dispatch] = useReducer(reduce, initialState);

  const actions = useMemo<ToolModeActions>(
    () => ({
      toggleMode: (mode) => dispatch({ type: "toggleMode", mode }),
      toggleReassign: () => dispatch({ type: "toggleReassign" }),
      toggleFill: (fill) => dispatch({ type: "toggleFill", fill }),
      startReassign: (from) => dispatch({ type: "startReassign", from }),
      cancelReassign: () => dispatch({ type: "cancelReassign" }),
      openColorPicker: () => dispatch({ type: "setColorPicker", open: true }),
      closeColorPicker: () => dispatch({ type: "setColorPicker", open: false }),
    }),
    [],
  );

  return [state, actions];
}
