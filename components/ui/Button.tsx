import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_STYLE: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover disabled:opacity-50",
  secondary:
    "border border-border bg-card text-foreground hover:bg-accent-soft/60 disabled:opacity-50",
  ghost: "text-muted-foreground hover:bg-accent-soft/60 disabled:opacity-50",
  danger: "bg-danger text-white hover:opacity-90 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        VARIANT_STYLE[variant],
        className
      )}
      {...props}
    />
  );
}
