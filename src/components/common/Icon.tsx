import type { SVGProps } from "react";

export type IconName =
  | "arrow-left"
  | "arrow-right"
  | "bolt"
  | "brain"
  | "briefcase"
  | "check"
  | "clapperboard"
  | "close"
  | "comments"
  | "credit-card"
  | "desktop"
  | "download"
  | "external"
  | "facebook"
  | "file"
  | "graduation-cap"
  | "home"
  | "laptop"
  | "menu"
  | "moon"
  | "music"
  | "palette"
  | "phone"
  | "reviews"
  | "search"
  | "shield"
  | "signal"
  | "sun"
  | "system"
  | "theme"
  | "tv"
  | "telegram";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

const paths: Record<IconName, string[]> = {
  "arrow-left": ["M19 12H5", "m12 19-7-7 7-7"],
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  bolt: ["m13 2-9 12h7l-1 8 10-13h-7Z"],
  brain: [
    "M12 5.6a3 3 0 0 0-5.7-1.3A3 3 0 0 0 4 7.1a3 3 0 0 0 .6 1.8A3 3 0 0 0 5.2 14a3 3 0 0 0 2 2.8A3 3 0 0 0 12 19.2Z",
    "M12 5.6a3 3 0 0 1 5.7-1.3A3 3 0 0 1 20 7.1a3 3 0 0 1-.6 1.8A3 3 0 0 1 18.8 14a3 3 0 0 1-2 2.8A3 3 0 0 1 12 19.2Z",
    "M12 5.6v13.6",
  ],
  briefcase: [
    "M3.5 8.5h17v9.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z",
    "M9 8.5V6.6A1.6 1.6 0 0 1 10.6 5h2.8A1.6 1.6 0 0 1 15 6.6v1.9",
    "M3.5 13h17",
  ],
  check: ["m5 12 4 4L19 6"],
  clapperboard: [
    "M3.5 9.6h17V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19Z",
    "M3 6.3 19.8 3.5l.7 3.4L3.7 9.7Z",
    "m8.3 5.5 1 3.6",
    "m13.5 4.6 1 3.7",
  ],
  close: ["m6 6 12 12", "M18 6 6 18"],
  comments: [
    "M2.5 6.4A1.7 1.7 0 0 1 4.2 4.7h10.4a1.7 1.7 0 0 1 1.7 1.7V11a1.7 1.7 0 0 1-1.7 1.7H8.4L5 15.6v-2.9h-.8A1.7 1.7 0 0 1 2.5 11Z",
    "M19 8.6h.8a1.7 1.7 0 0 1 1.7 1.7v4.5a1.7 1.7 0 0 1-1.7 1.7H19v2.9l-3.4-2.9h-2.2",
  ],
  "credit-card": [
    "M3 6.75A1.75 1.75 0 0 1 4.75 5h14.5A1.75 1.75 0 0 1 21 6.75v10.5A1.75 1.75 0 0 1 19.25 19H4.75A1.75 1.75 0 0 1 3 17.25Z",
    "M3 9h18",
    "M7 15h3",
  ],
  desktop: ["M5 5.5h14v9H5Z", "M3 18.5h18", "M10 15.5h4"],
  download: ["M12 3v12", "m7 11 5 5 5-5", "M4 20h16"],
  external: [
    "M14 4h6v6",
    "M20 4 11 13",
    "M19 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  ],
  file: ["M6 2h7l5 5v15H6Z", "M13 2v5h5", "M9 13h6", "M9 17h6"],
  "graduation-cap": [
    "m2.5 9 9.5-4 9.5 4-9.5 4Z",
    "M6.6 11.1v4.4c0 1.4 2.4 2.5 5.4 2.5s5.4-1.1 5.4-2.5v-4.4",
    "M21.5 9v5.2",
  ],
  home: ["m3 11 9-8 9 8", "M5 10v10h14V10", "M9 20v-6h6v6"],
  laptop: ["M5.5 6h13v9.5h-13Z", "M2.5 19h19"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  moon: ["M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"],
  music: [
    "M9 17.4a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
    "M20 15.4a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
    "M9 17.4V6l11-2v11.4",
  ],
  palette: [
    "M12 3a9 9 0 1 0 0 18 1.8 1.8 0 0 0 1.8-1.8 1.8 1.8 0 0 1 1.8-1.8h1.6A3.8 3.8 0 0 0 21 13.6C21 7.7 16.9 3 12 3Z",
    "M8 9.6h.01",
    "M11.6 7.6h.01",
    "M15.4 9.6h.01",
    "M7.8 14h.01",
  ],
  phone: [
    "M7 2.5h10a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V4A1.5 1.5 0 0 1 7 2.5Z",
    "M10.5 18.5h3",
  ],
  reviews: [
    "M12 3.5 14.6 8l5.1 1.1-3.5 3.8.5 5.1-4.7-2.1L7.3 18l.5-5.1-3.5-3.8L9.4 8Z",
  ],
  facebook: ["M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"],
  search: ["m21 21-4.35-4.35", "M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"],
  shield: [
    "M12 3l7.5 2.8v5.5c0 4.3-3 8-7.5 9.2-4.5-1.2-7.5-4.9-7.5-9.2V5.8Z",
    "M12 3v17.5",
  ],
  signal: ["M4.5 19v-3.5", "M9.5 19v-7", "M14.5 19v-10.5", "M19.5 19V5"],
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
  tv: ["M4 5.5h16v11H4Z", "m9 2.5 3 3 3-3", "M8.5 20.5h7"],
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
