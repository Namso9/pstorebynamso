import type { ButtonHTMLAttributes } from "react";

import { HapticSwitch } from "./HapticSwitch";
import type { HapticIntensity } from "@/lib/haptics";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Tap feedback strength, or `false` to leave this button silent. */
  haptic?: HapticIntensity | false;
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return ["button", `button--${variant}`, `button--${size}`, className]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  haptic = "light",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, className })}
      data-haptic={haptic || undefined}
      {...props}
    >
      {children}
      {/* Submit only. The iOS overlay is reserved for controls that commit
          something (see `HapticSwitch`) — a secondary or quiet button keeps the
          Android `data-haptic` buzz and no overlay, so its click stays a plain
          browser click. */}
      {haptic && type === "submit" ? <HapticSwitch mode="submit" /> : null}
    </button>
  );
}
