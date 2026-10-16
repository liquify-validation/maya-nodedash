import {
  ArcElement,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  Tooltip,
  type Plugin,
} from "chart.js";

// Chart.js is loaded lazily (charts only appear in popovers, modals and the report),
// so registration and global Chart.js 2 look-alike defaults live here.

/** The original dashboard padded every legend by 20px (a Chart.js 2 afterFit patch). */
const legendSpacing: Plugin = {
  id: "legendSpacing",
  beforeInit(chart) {
    const legend = chart.legend as (typeof chart.legend & { fit: () => void }) | undefined;
    if (!legend) return;
    const fit = legend.fit.bind(legend);
    legend.fit = function () {
      fit();
      this.height += 20;
    };
  },
};

Chart.register(LineController, ScatterController, DoughnutController, LineElement, PointElement, ArcElement, LinearScale, Legend, Tooltip, legendSpacing);

// Chart.js 2 filled line-chart legend swatches with the line colour rather than the point colour.
const defaultLabels = Chart.defaults.plugins.legend.labels.generateLabels;
Chart.overrides.line.plugins = {
  ...Chart.overrides.line.plugins,
  legend: { labels: { generateLabels: (chart) => defaultLabels(chart).map((l) => ({ ...l, fillStyle: l.strokeStyle })) } },
} as typeof Chart.overrides.line.plugins;

export { Chart };
