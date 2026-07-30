import type { SVGProps } from "react";

export type IconName = "draw" | "select" | "image" | "revert";

type IconVariant = "fill" | "stroke";

interface IconDef {
  variant: IconVariant;
  paths: string[];
}

const ICONS: Record<IconName, IconDef> = {
  draw: {
    variant: "fill",
    paths: [
      "M18 2h-2v2h-2v2h-2v2h-2v2H8v2H6v2H4v2H2v6h6v-2h2v-2h2v-2h2v-2h2v-2h2v-2h2V8h2V6h-2V4h-2zm0 8h-2v2h-2v2h-2v2h-2v2H8v-2H6v-2h2v-2h2v-2h2V8h2V6h2v2h2zM6 16H4v4h4v-2H6z",
    ],
  },
  select: {
    variant: "fill",
    paths: [
      "M5 21H3v-2h2zm4 0H7v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2zM5 17H3v-2h2zm16 0h-2v-2h2zM5 13H3v-2h2zm16 0h-2v-2h2zM5 9H3V7h2zm16 0h-2V7h2zM5 5H3V3h2zm4 0H7V3h2zm4 0h-2V3h2zm4 0h-2V3h2zm4 0h-2V3h2z",
    ],
  },
  image: {
    variant: "fill",
    paths: [
      "M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zm-4 8h2v2h-2zm-2 2h2v2h-2zm4 0h2v2h-2zm-8 0h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2z",
      "M20 16h2v2h-2zM8 16h2v2H8zm-2 2h2v2H6zM8 6h2v2H8zM6 8h2v2H6zm2 2h2v2H8zm2-2h2v2h-2z",
    ],
  },
  revert: {
    variant: "stroke",
    paths: ["M9 14 4 9l5-5", "M4 9h11a5 5 0 0 1 0 10h-1"],
  },
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  const { variant, paths } = ICONS[name];
  const stroke = variant === "stroke";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={stroke ? "none" : "currentColor"}
      stroke={stroke ? "currentColor" : undefined}
      strokeWidth={stroke ? 2 : undefined}
      strokeLinecap={stroke ? "round" : undefined}
      strokeLinejoin={stroke ? "round" : undefined}
      aria-hidden
      {...props}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
