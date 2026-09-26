import type { ReactNode } from "react";

export function StatCard({
  icon,
  value,
  unit,
  label,
  tone = "default",
}: {
  icon: ReactNode;
  value: string;
  unit?: string;
  label: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div
        className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${
          tone === "danger"
            ? "bg-danger-soft text-danger"
            : "bg-accent-soft text-accent"
        }`}
      >
        {icon}
      </div>
      <p
        className={`text-2xl font-bold ${
          tone === "danger" ? "text-danger" : "text-foreground"
        }`}
      >
        {value}
        {unit && <span className="ml-1 text-base font-normal">{unit}</span>}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
