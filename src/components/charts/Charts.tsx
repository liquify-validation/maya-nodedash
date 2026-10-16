import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Chart, ChartData, ChartOptions, ChartType } from "chart.js";
import { Switch } from "../ui/Switch";
import type { Point, Series } from "../../api/history";

/** Create the chart once, then update it in place when data/options change. */
function useChart<T extends ChartType>(type: T, data: ChartData<T>, options: ChartOptions<T>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<T> | null>(null);
  const latest = useRef({ data, options });
  latest.current = { data, options };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};
    void import("./setup").then(({ Chart }) => {
      if (disposed) return;
      const chart = new Chart(canvas, { type, ...latest.current }) as Chart<T>;
      chartRef.current = chart;
      // Chart.js measures its container with getBoundingClientRect, which includes the
      // modal/popover zoom-in transform; re-measure once the opening animation finishes.
      const overlay = canvas.closest(".ant-modal, .ant-popover");
      const resize = () => chart.resize();
      overlay?.addEventListener("animationend", resize);
      cleanup = () => {
        overlay?.removeEventListener("animationend", resize);
        chart.destroy();
        chartRef.current = null;
      };
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [type]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || (chart.data === data && chart.options === options)) return;
    chart.data = data;
    chart.options = options;
    chart.update();
  }, [data, options]);

  return canvasRef;
}

interface LineChartProps {
  datasets: ChartData<"line", Point[]>["datasets"];
  options: ChartOptions<"line">;
  /** Offer a Value / "Average / 100 Blocks" switch between dataset 0 and 1, with these y-axis labels. */
  averageToggle?: { valueLabel: string; averageLabel: string };
}

export function LineChart({ datasets, options, averageToggle }: LineChartProps) {
  const [showAverage, setShowAverage] = useState(false);
  const hasToggle = Boolean(averageToggle) && datasets.length > 1;
  const index = hasToggle && showAverage ? 1 : 0;
  const yLabel = hasToggle ? (index === 1 ? averageToggle!.averageLabel : averageToggle!.valueLabel) : undefined;

  const data = useMemo(() => ({ datasets: [datasets[index]] }), [datasets, index]);
  const opts = useMemo(() => (yLabel ? withYLabel(options, yLabel) : options), [options, yLabel]);
  const canvasRef = useChart("line", data, opts);

  return (
    <div className="custom-line-chart" style={{ textAlign: "center" }}>
      {hasToggle && (
        <div style={{ alignItems: "center", textAlign: "center", marginBottom: "10px" }}>
          <Switch checked={showAverage} onChange={setShowAverage} className="custom-switch" label="Average per 100 blocks" />
          <span style={{ marginLeft: "10px", fontSize: "14px" }}>Average / 100 Blocks</span>
        </div>
      )}
      <div className="chart-canvas-box">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

function withYLabel(options: ChartOptions<"line">, text: string): ChartOptions<"line"> {
  const y = options.scales?.y;
  return { ...options, scales: { ...options.scales, y: { ...y, title: { ...y?.title, display: true, text } } } };
}

export function ScatterChart({ datasets, options }: { datasets: ChartData<"scatter", Point[]>["datasets"]; options: ChartOptions<"scatter"> }) {
  const data = useMemo(() => ({ datasets }), [datasets]);
  const canvasRef = useChart("scatter", data, options);
  return (
    <div className="custom-scatter-chart">
      <div className="chart-canvas-box">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export function DoughnutChart({ data, options }: { data: ChartData<"doughnut">; options: ChartOptions<"doughnut"> }) {
  const canvasRef = useChart("doughnut", data, options);
  return (
    <div className="custom-pie-chart" style={{ position: "relative" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

/**
 * Fetches a history series when mounted (i.e. when its popover opens) and renders it,
 * showing "No data available" when the API has nothing.
 */
export function LazySeries({ load, children }: { load: () => Promise<Series>; children: (series: Point[][]) => ReactNode }) {
  const [state, setState] = useState<{ status: "loading" } | { status: "done"; series: Series }>({ status: "loading" });
  const loadRef = useRef(load);

  useEffect(() => {
    let cancelled = false;
    loadRef
      .current()
      .then((series) => !cancelled && setState({ status: "done", series }))
      .catch((err) => {
        console.error("Failed to load chart data", err);
        if (!cancelled) setState({ status: "done", series: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") return <div>Loading...</div>;
  if (!state.series || state.series[0].length === 0) return <div>No data available</div>;
  return <>{children(state.series)}</>;
}
