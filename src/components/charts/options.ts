import type { ChartOptions, Scale, Tick } from "chart.js";
import type { Theme } from "../../types";

// Pure option builders (type-only Chart.js imports) so pages can build options without loading Chart.js.

/** Chart.js 2 linear tick formatting: plain fixed-point numbers, no thousands separators. */
export function v2TickLabel(this: Scale, value: number | string, index: number, ticks: Tick[]): string {
  const v = Number(value);
  if (v === 0) return "0";
  const delta = ticks.length > 1 ? Math.abs(ticks[1].value - ticks[0].value) : Math.abs(v);
  const decimals = Math.max(Math.min(-Math.floor(Math.log10(delta || 1)), 20), 0);
  void index;
  return v.toFixed(decimals);
}

/** Chart.js 2 "nice number" (rounding up) used for tick spacing. */
function niceNum(range: number): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * 10 ** exponent;
}

/**
 * With a fixed axis start, Chart.js 2 counted ticks up from that start (min, min+step, ...,
 * then max) at a "nice" spacing for at most 10 ticks, rather than snapping to round numbers.
 */
function ticksFromMin(scale: Scale) {
  const step = niceNum((scale.max - scale.min) / 9);
  const ticks: Tick[] = [];
  for (let v = scale.min; scale.max - v >= step / 2; v += step) ticks.push({ value: v });
  ticks.push({ value: scale.max });
  scale.ticks = ticks;
}

export const DATASET_BLUE = { backgroundColor: "rgb(28, 57, 182)", borderColor: "rgba(28, 57, 187, 0.2)", fill: false, tension: 0 } as const;

interface AxisConfig {
  yLabel: string;
  xMin?: number;
  xMax?: number;
  /** Fixed y range (position charts use 0-120). */
  yMin?: number;
  yMax?: number;
  /** When false, x ticks use the default spacing (rewards/slashes charts). */
  limitXTicks?: boolean;
}

/** Axis options shared by every history chart, themed for light/dark. */
export function historyChartOptions<T extends "line" | "scatter">(theme: Theme, axis: AxisConfig): ChartOptions<T> {
  const grid = { color: theme === "light" ? "#E0E0E0" : "rgba(255, 255, 255, 0.1)" };
  const color = theme === "light" ? "black" : "white";
  const limit = axis.limitXTicks ?? true;
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        min: axis.xMin,
        max: axis.xMax,
        afterBuildTicks: axis.xMin !== undefined ? ticksFromMin : undefined,
        grid,
        title: { display: true, text: "Block Height", color },
        ticks: {
          color,
          ...(limit ? { autoSkip: true, maxTicksLimit: 10 } : {}),
          callback: (value) => String(value),
        },
      },
      y: {
        min: axis.yMin,
        max: axis.yMax,
        grid,
        title: { display: true, text: axis.yLabel, color },
        ticks: { color, callback: v2TickLabel },
      },
    },
  };
  return options as ChartOptions<T>;
}

export const xRange = (points: { x: number }[]) => ({
  xMin: Math.min(...points.map((p) => p.x)),
  xMax: Math.max(...points.map((p) => p.x)),
});
