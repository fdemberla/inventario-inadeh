"use client";

import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import type { SeriesPoint } from "@/lib/reports/kpis";

interface MovementsChartProps {
  points: SeriesPoint[];
  granularity: "day" | "week";
}

/** Reads the validated chart tokens from CSS so light/dark stay in sync. */
function readTheme() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    receipts: v("--chart-receipts"),
    shipments: v("--chart-shipments"),
    text: v("--fg-muted"),
    grid: v("--line"),
    surface: v("--surface"),
  };
}

const fmtDate = (iso: string, granularity: "day" | "week") => {
  const d = new Date(`${iso}T00:00:00`);
  const s = d.toLocaleDateString("es-PA", { day: "numeric", month: "short" });
  return granularity === "week" ? `Sem. ${s}` : s;
};

/**
 * Receipts vs shipments (units) over time: one axis, two validated series,
 * legend + tooltip, and a table view for screen readers / exact values.
 */
export function MovementsChart({ points, granularity }: MovementsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scheme, setScheme] = useState(0); // bumps on light/dark change

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setScheme((n) => n + 1);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || points.length === 0) return;
    const t = readTheme();
    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: points.map((p) => fmtDate(p.bucket, granularity)),
        datasets: [
          {
            label: "Recepciones",
            data: points.map((p) => p.receipts),
            backgroundColor: t.receipts,
            borderRadius: { topLeft: 4, topRight: 4 },
            borderSkipped: "bottom",
            borderColor: t.surface,
            borderWidth: { right: 2, left: 0, top: 0, bottom: 0 }, // 2px gap between paired bars
            maxBarThickness: 28,
          },
          {
            label: "Despachos",
            data: points.map((p) => p.shipments),
            backgroundColor: t.shipments,
            borderRadius: { topLeft: 4, topRight: 4 },
            borderSkipped: "bottom",
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : undefined,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: { color: t.text, usePointStyle: true, pointStyle: "rectRounded", boxWidth: 10 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString("es-PA")} unidades`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: t.text, maxRotation: 0, autoSkip: true } },
          y: {
            beginAtZero: true,
            grid: { color: t.grid },
            border: { display: false },
            ticks: { color: t.text, precision: 0 },
            title: { display: true, text: "Unidades", color: t.text },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [points, granularity, scheme]);

  if (points.length === 0) {
    return (
      <p className="text-fg-muted border-line rounded-xl border border-dashed p-8 text-center text-sm">
        Sin recepciones ni despachos en este período.
      </p>
    );
  }

  return (
    <div>
      <div className="relative h-64 sm:h-72">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Gráfico de barras: unidades recibidas y despachadas por ${granularity === "week" ? "semana" : "día"}. Los valores están en la tabla siguiente.`}
        />
      </div>
      <details className="mt-3">
        <summary className="text-accent focus-visible:outline-focus inline-flex min-h-11 cursor-pointer items-center rounded text-sm font-semibold focus-visible:outline-2">
          Ver datos como tabla
        </summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Unidades recibidas y despachadas</caption>
            <thead className="text-fg-muted">
              <tr>
                <th scope="col" className="py-2 pr-4 font-semibold">{granularity === "week" ? "Semana" : "Día"}</th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">Recepciones</th>
                <th scope="col" className="py-2 text-right font-semibold">Despachos</th>
              </tr>
            </thead>
            <tbody className="text-fg">
              {points.map((p) => (
                <tr key={p.bucket} className="border-line border-t">
                  <td className="py-2 pr-4">{fmtDate(p.bucket, granularity)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{p.receipts.toLocaleString("es-PA")}</td>
                  <td className="py-2 text-right tabular-nums">{p.shipments.toLocaleString("es-PA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
