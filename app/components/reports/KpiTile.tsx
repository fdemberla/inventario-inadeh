import type { LucideIcon } from "lucide-react";
import { Badge, type BadgeTone } from "@/app/components/ui";

interface KpiTileProps {
  label: string;
  value: string;
  /** One line of context: what the number is made of. */
  detail?: string;
  icon: LucideIcon;
  /** Status always carries text, never colour alone (WCAG 1.4.1). */
  status?: { tone: BadgeTone; label: string };
}

/** Stat tile: the headline number of one KPI. */
export function KpiTile({ label, value, detail, icon: Icon, status }: KpiTileProps) {
  return (
    <div className="border-line bg-surface flex flex-col gap-3 rounded-2xl border p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-fg-muted text-sm font-semibold">{label}</p>
        <span className="bg-accent/10 text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="text-fg text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        {status && <Badge tone={status.tone}>{status.label}</Badge>}
        {detail && <p className="text-fg-muted text-xs">{detail}</p>}
      </div>
    </div>
  );
}
