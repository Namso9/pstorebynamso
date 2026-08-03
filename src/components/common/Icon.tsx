import type { SVGProps } from "react";

export type IconName =
  | "arrow-left"
  | "arrow-right"
  | "bolt"
  | "check"
  | "close"
  | "credit-card"
  | "facebook"
  | "file"
  | "home"
  | "menu"
  | "moon"
  | "reviews"
  | "search"
  | "sun"
  | "system"
  | "theme"
  | "telegram";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

const paths: Record<IconName, string[]> = {
  "arrow-left": ["M19 12H5", "m12 19-7-7 7-7"],
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  bolt: ["m13 2-9 12h7l-1 8 10-13h-7Z"],
  check: ["m5 12 4 4L19 6"],
  close: ["m6 6 12 12", "M18 6 6 18"],
  "credit-card": [
    "M3 6.75A1.75 1.75 0 0 1 4.75 5h14.5A1.75 1.75 0 0 1 21 6.75v10.5A1.75 1.75 0 0 1 19.25 19H4.75A1.75 1.75 0 0 1 3 17.25Z",
    "M3 9h18",
    "M7 15h3",
  ],
  file: ["M6 2h7l5 5v15H6Z", "M13 2v5h5", "M9 13h6", "M9 17h6"],
  home: ["m3 11 9-8 9 8", "M5 10v10h14V10", "M9 20v-6h6v6"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  moon: ["M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"],
  reviews: [
    "M12 3.5 14.6 8l5.1 1.1-3.5 3.8.5 5.1-4.7-2.1L7.3 18l.5-5.1-3.5-3.8L9.4 8Z",
  ],
  facebook: ["M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"],
  search: ["m21 21-4.35-4.35", "M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"],
  sun: [
    "M12 16.25A4.25 4.25 0 1 0 12 7.75a4.25 4.25 0 0 0 0 8.5Z",
    "M12 2v2",
    "M12 20v2",
    "m4.93 4.93 1.42 1.42",
    "m17.65 17.65 1.42 1.42",
    "M2 12h2",
    "M20 12h2",
    "m4.93 19.07 1.42-1.42",
    "m17.65 6.35 1.42-1.42",
  ],
  system: [
    "M4.5 5.5h15v10h-15Z",
    "M9 19h6",
    "M12 15.5V19",
  ],
  theme: [
    "M12 3a9 9 0 1 0 0 18Z",
  ],
  telegram: [
    "m21 3-7.5 18-4.3-6.2L3 12.5Z",
    "m9.2 14.8 3.1-3 3.3-3.2",
  ],
};

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}
