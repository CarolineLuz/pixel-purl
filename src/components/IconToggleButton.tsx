import { Icon, type IconName } from "./Icon";
import { iconToggleBtn } from "../styles/ui";

interface IconToggleButtonProps {
  /** Which icon to show (also implies the button's meaning). */
  icon: IconName;
  /** Accessible label / tooltip. */
  label: string;
  /** Whether this toggle is the active one (brand-filled). */
  active: boolean;
  onClick: () => void;
}

/** A compact square button carrying a single 20px icon, filling with the brand
 *  colour while active. Used for the mutually-exclusive drawing sub-modes. */
export function IconToggleButton({
  icon,
  label,
  active,
  onClick,
}: IconToggleButtonProps) {
  return (
    <button
      type="button"
      className={iconToggleBtn(active)}
      aria-pressed={active}
      aria-label={label}
      data-tooltip={label}
      onClick={onClick}
    >
      <Icon name={icon} size={18} className="flex-none" />
    </button>
  );
}
