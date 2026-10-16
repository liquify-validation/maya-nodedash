import { useMemo, type ReactElement, type ReactNode } from "react";
import {
  loadBond,
  loadPosition,
  loadRewards,
  loadSlashes,
  loadTotalBond,
  type Point,
  type Series,
} from "../../api/history";
import { useTheme } from "../../hooks/theme";
import { useRefreshPause } from "../../hooks/networkData";
import { POSITION_CHART_MAX, UNIT, unitLabel } from "../../chain";
import type { Theme } from "../../types";
import { Popover, type TriggerProps } from "../ui/Popover";
import { LazySeries, LineChart, ScatterChart } from "./Charts";
import { DATASET_BLUE, historyChartOptions, xRange } from "./options";

export type HistoryKind = "bond" | "rewards" | "slashes" | "position" | "totalBond";

const loaders: Record<HistoryKind, (node: string) => Promise<Series>> = {
  bond: loadBond,
  rewards: loadRewards,
  slashes: loadSlashes,
  position: loadPosition,
  totalBond: () => loadTotalBond(),
};

function HistoryChartBody({ kind, series, theme }: { kind: HistoryKind; series: Point[][]; theme: Theme }) {
  const chart = useMemo(() => buildChart(kind, series, theme), [kind, series, theme]);
  return chart;
}

function buildChart(kind: HistoryKind, series: Point[][], theme: Theme): ReactElement {
  const [first, second] = series;
  switch (kind) {
    case "position":
      return (
        <ScatterChart
          datasets={[
            { label: "Max", data: first, backgroundColor: "blue", pointRadius: 5 },
            { label: "Position", data: second, backgroundColor: "orange", pointRadius: 5 },
          ]}
          options={historyChartOptions(theme, { yLabel: "Position", ...xRange([...first, ...second]), yMin: 0, yMax: POSITION_CHART_MAX })}
        />
      );
    case "rewards":
    case "slashes": {
      const labels =
        kind === "rewards"
          ? { valueLabel: unitLabel("Reward Amount"), averageLabel: `Average (${UNIT}) per 100 Blocks` }
          : { valueLabel: "Slashes Value", averageLabel: "Average slashes per 100 Blocks" };
      return (
        <LineChart
          datasets={[
            { label: "Value", data: first, ...DATASET_BLUE },
            { label: "Average", data: second, ...DATASET_BLUE },
          ]}
          options={historyChartOptions(theme, { yLabel: labels.valueLabel, limitXTicks: false })}
          averageToggle={labels}
        />
      );
    }
    default: {
      const yLabel = unitLabel(kind === "bond" ? "Bond Amount" : "Total Bond Amount");
      const range = xRange(first);
      // The per-node bond chart only pins the start of the x axis.
      const axis = kind === "bond" ? { xMin: range.xMin } : range;
      return <LineChart datasets={[{ label: "Value", data: first, ...DATASET_BLUE }]} options={historyChartOptions(theme, { yLabel, ...axis })} />;
    }
  }
}

interface HistoryPopoverProps {
  kind: HistoryKind;
  title: string;
  node?: string;
  children: ReactElement<TriggerProps>;
}

/**
 * Click popover that loads and charts a history series. Data refreshes are held while
 * it is open so the table doesn't reshuffle underneath.
 */
export function HistoryPopover({ kind, title, node = "", children, ...triggerProps }: HistoryPopoverProps & TriggerProps) {
  const { theme } = useTheme();
  const setRefreshPaused = useRefreshPause();
  const content: ReactNode = (
    <LazySeries load={() => loaders[kind](node)}>{(series) => <HistoryChartBody kind={kind} series={series} theme={theme} />}</LazySeries>
  );
  return (
    <Popover trigger="click" title={title} overlayClassName="my-custom-popover" content={content} onOpenChange={setRefreshPaused} {...triggerProps}>
      {children}
    </Popover>
  );
}
