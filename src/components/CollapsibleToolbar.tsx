import type { ReactNode } from "react";
import type { ToolbarLayout } from "../config/toolbars";
import {
  toolbarBase,
  toolbarCloseBtn,
  toolbarModeBtn,
  toolbarPanel,
  toolbarScroll,
} from "../styles/ui";
import { Icon, type IconName } from "./Icon";

interface CollapsibleToolbarProps {
  /** Whether the panel is expanded. */
  open: boolean;
  onToggle: () => void;
  /** Container element. A `form` guards against implicit submits. */
  as?: "div" | "form";
  /** aria-label for the toolbar container. */
  label: string;
  layout: ToolbarLayout;
  /** Icon and aria-label for the toggle button when collapsed. */
  collapsedIcon: IconName;
  collapsedLabel: string;
  /** Icon and aria-label for the toggle button when expanded. */
  expandedIcon?: IconName;
  expandedLabel: string;
  /** Tools revealed once expanded. */
  children: ReactNode;
}

/**
 * The shared shell for the stacked side toolbars: a collapsed tab that expands
 * into a panel, with the toggle turning into a close button that overhangs the
 * panel's top-right edge. Each toolbar supplies its own body via `children`.
 */
export function CollapsibleToolbar({
  open,
  onToggle,
  as = "div",
  label,
  layout,
  collapsedIcon,
  collapsedLabel,
  expandedIcon = "close",
  expandedLabel,
  children,
}: CollapsibleToolbarProps) {
  const containerClass = `${toolbarBase} ${layout.top} ${
    open ? `${toolbarPanel} min-[821px]:z-[16] ${layout.width}` : ""
  }`;

  const body = open ? (
    <>
      <button
        type="button"
        className={toolbarCloseBtn}
        aria-pressed={true}
        aria-label={expandedLabel}
        onClick={onToggle}
      >
        <Icon name={expandedIcon} />
      </button>
      <div className={`${toolbarScroll} ${layout.maxHeight}`}>{children}</div>
    </>
  ) : (
    <button
      type="button"
      className={toolbarModeBtn}
      aria-pressed={false}
      aria-label={collapsedLabel}
      onClick={onToggle}
    >
      <Icon name={collapsedIcon} />
    </button>
  );

  if (as === "form") {
    return (
      <form
        className={containerClass}
        aria-label={label}
        onSubmit={(e) => e.preventDefault()}
      >
        {body}
      </form>
    );
  }

  return (
    <div className={containerClass} role="toolbar" aria-label={label}>
      {body}
    </div>
  );
}
