import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router";
import { api, type ReportResponse } from "../api/client";
import type { Point } from "../api/history";
import { LineChart, ScatterChart } from "../components/charts/Charts";
import { DATASET_BLUE, historyChartOptions, xRange } from "../components/charts/options";
import { Loading, PageLayout } from "../components/layout/PageLayout";
import { Breadcrumb, Card } from "../components/ui/Basic";
import { Button } from "../components/ui/Button";
import {
  DownSquareOutlined,
  FundProjectionScreenOutlined,
  GiftOutlined,
  NodeExpandOutlined,
  OrderedListOutlined,
  RiseOutlined,
  TrophyOutlined,
  UpSquareOutlined,
} from "../components/ui/icons";
import { message } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Table, type TableColumn } from "../components/ui/Table";
import { BASE_UNITS, POSITION_CHART_MAX, UNIT, formatAmount, unitLabel } from "../chain";
import { useTheme } from "../hooks/theme";


interface ReportRow {
  churnHeight: number;
  date: string;
  price: string;
  rewards: string;
  dollarValue: string;
}

const COLUMNS: TableColumn<ReportRow>[] = [
  { title: "Height", key: "churnHeight" },
  { title: "Date", key: "date" },
  { title: "Price", key: "price" },
  { title: `Rewards (${UNIT})`, key: "rewards" },
  { title: "Rewards ($)", key: "dollarValue" },
];
const HEADERS = COLUMNS.map((c) => c.title);
const rowValues = (r: ReportRow) => COLUMNS.map((c) => r[c.key]);

function toRows(data: ReportResponse): ReportRow[] {
  const t = data.tableData;
  return t.churnHeight.map((height, i) => ({
    churnHeight: height,
    date: t.date[i],
    price: Number(t.price[i]).toFixed(2),
    rewards: Number(t.rewards[i]).toFixed(2),
    dollarValue: Number(t.dollarValue[i]).toFixed(2),
  }));
}

async function exportPdf(rows: ReportRow[]) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF("landscape", "pt", "A4");
  doc.setFontSize(10);
  doc.text("Report", 40, 40);
  autoTable(doc, { startY: 50, head: [HEADERS], body: rows.map(rowValues) });
  doc.save("report.pdf");
}

function exportCsv(rows: ReportRow[]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [HEADERS, ...rows.map(rowValues)].map((r) => r.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function SummaryItem({ icon, title, value }: { icon: ReactNode; title: string; value: ReactNode }) {
  return (
    <div className="overview-item">
      {icon}
      <div className="overview-item__value">
        <div className="overview-item__value-title">{title}</div>
        <div className="overview-item__value-value">{value}</div>
      </div>
    </div>
  );
}

const iconStyle = { fontSize: "20px" };
const amount = (v: number) => formatAmount(Math.round(v / BASE_UNITS));

function ReportSummary({ data }: { data: ReportResponse }) {
  return (
    <div className="overview-list-report">
      <SummaryItem icon={<UpSquareOutlined style={iconStyle} />} title="Start Block" value={data.startBlock} />
      <SummaryItem icon={<DownSquareOutlined style={iconStyle} />} title="End Block" value={data.endBlock} />
      <SummaryItem icon={<NodeExpandOutlined style={iconStyle} />} title="Start Bond" value={amount(data.startBond)} />
      <SummaryItem icon={<TrophyOutlined style={iconStyle} />} title="End Bond" value={amount(data.endBond)} />
      <SummaryItem icon={<FundProjectionScreenOutlined style={iconStyle} />} title="Bond Increase" value={amount(data.BondIncrease)} />
      <SummaryItem icon={<OrderedListOutlined style={iconStyle} />} title="Position (Average)" value={data.position} />
      <SummaryItem icon={<RiseOutlined style={iconStyle} />} title="Max Position (Average)" value={data.maxPosition} />
      <SummaryItem icon={<GiftOutlined style={iconStyle} />} title="Total Rewards" value={amount(data.totalRewards)} />
    </div>
  );
}

/** The three chart cards; the (empty) rows are always rendered, as on the original page. */
function ReportCharts({ data, node }: { data: ReportResponse | null; node: string }) {
  const { theme } = useTheme();
  const charts = useMemo(() => {
    const g = data?.graphData;
    if (!g?.Xticks) return null;
    const at = (values: number[], map: (v: number) => number = (v) => v): Point[] => g.Xticks.map((x, i) => ({ x: Number(x), y: map(values[i]) }));
    const toWhole = (v: number) => Math.round(v / BASE_UNITS);
    const bond = at(g.bond, toWhole);
    const rewards = at(g.rewards, toWhole);
    const max = at(g.maxPosition);
    const position = at(g.position);
    return {
      bond: { datasets: [{ label: "Bond Value", data: bond, ...DATASET_BLUE }], options: historyChartOptions<"line">(theme, { yLabel: unitLabel("Bond Amount"), xMin: xRange(bond).xMin }) },
      position: {
        datasets: [
          { label: "Max Position", data: max, backgroundColor: "blue", pointRadius: 5 },
          { label: "Position", data: position, backgroundColor: "orange", pointRadius: 5 },
        ],
        options: historyChartOptions<"scatter">(theme, { yLabel: "Position", ...xRange(g.Xticks.map((x) => ({ x }))), yMin: 0, yMax: POSITION_CHART_MAX }),
      },
      rewards: { datasets: [{ label: "Rewards Value", data: rewards, ...DATASET_BLUE }], options: historyChartOptions<"line">(theme, { yLabel: unitLabel("Reward Amount"), limitXTicks: false }) },
    };
  }, [data, theme]);

  const cardStyle = { borderRadius: "10px", overflow: "hidden", background: theme === "light" ? "white" : "#151515", boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2)" };
  const titleColor = { color: theme === "light" ? "black" : "white" };
  const row = (marginTop?: string) => ({ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px", marginTop });

  return (
    <>
      <div style={row("20px")}>
        {charts && (
          <Card style={cardStyle} title={<span style={titleColor}>Bond Value Over Time for {node}</span>}>
            <LineChart datasets={charts.bond.datasets} options={charts.bond.options} />
          </Card>
        )}
      </div>
      <div style={{ ...row(), width: "100%" }}>
        {charts && (
          <Card style={cardStyle} title={<span style={titleColor}>Performance Over Time for {node}</span>}>
            <ScatterChart datasets={charts.position.datasets} options={charts.position.options} />
          </Card>
        )}
      </div>
      <div style={row()}>
        {charts && (
          <Card style={cardStyle} title={<span style={titleColor}>Reward Value Over Time for {node}</span>}>
            <LineChart datasets={charts.rewards.datasets} options={charts.rewards.options} />
          </Card>
        )}
      </div>
    </>
  );
}

export function ReportPage() {
  const { nodeAddress = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [churns, setChurns] = useState<{ value: number; label: string }[]>([]);
  const [from, setFrom] = useState<number>();
  const [to, setTo] = useState<number>();
  const [report, setReport] = useState<ReportResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setReport(null);
    setFrom(undefined);
    setTo(undefined);
    api
      .churnsForNode(nodeAddress)
      .then((list) => {
        if (cancelled) return;
        if (list.length === 0) message.error("No data returned from the API");
        setChurns(list.map((c) => ({ value: c.churnHeight, label: `${c.churnHeight} (${c.date})` })));
      })
      .catch((err) => {
        console.error("Failed to fetch churns", err);
        if (!cancelled) message.error("Failed to fetch data");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [nodeAddress]);

  const rows = useMemo(() => (report ? toRows(report) : []), [report]);
  const toOptions = useMemo(() => churns.filter((c) => from !== undefined && c.value > from), [churns, from]);

  const submit = async () => {
    if (from === undefined || to === undefined || !nodeAddress) {
      message.error("Please select both start and end values and provide a node address.");
      return;
    }
    try {
      setReport(await api.generateReport({ start: from, end: to, node: nodeAddress }));
      message.success("Report generated successfully");
    } catch (err) {
      console.error("Failed to generate report", err);
      message.error(`Failed to generate report: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <PageLayout fullWidth>
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="layout-content-wrapper">
            <Breadcrumb items={[{ label: "Dashboard", to: "/" }, { label: "Report", current: true }]} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: "20px" }}>
              <h1 className="report-title">Report for Node Address {nodeAddress}</h1>
              <h2 className="report-subtitle">Generate report based on the churns below</h2>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", marginBottom: "20px", paddingLeft: "70px" }}>
            <div style={{ marginRight: "20px" }}>
              <label htmlFor="churnsFrom" style={{ marginRight: "10px", fontWeight: 500 }}>
                Churns From:
              </label>
              <Select
                id="churnsFrom"
                value={from}
                options={churns}
                onChange={(v) => {
                  setFrom(v);
                  if (to !== undefined && to <= v) setTo(undefined);
                }}
                placeholder="Select From"
                style={{ width: 200 }}
                className="custom-select"
              />
            </div>
            <div style={{ marginRight: "20px" }}>
              <label htmlFor="churnsTo" style={{ marginRight: "10px", fontWeight: 500 }}>
                Churns To:
              </label>
              <Select id="churnsTo" value={to} options={toOptions} onChange={setTo} placeholder="Select To" style={{ width: 200 }} className="custom-select" />
            </div>
            <Button type="primary" onClick={submit}>
              Submit
            </Button>
          </div>

          {report && (
            <>
              <ReportSummary data={report} />
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px", marginTop: "40px" }}>
                <Table className="table-report" columns={COLUMNS} rows={rows} rowKey={(r) => r.churnHeight} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <Button type="primary" onClick={() => void exportPdf(rows)} style={{ width: "20%", padding: "0 20px", marginRight: "10px" }}>
                  Download as PDF
                </Button>
                <Button type="primary" onClick={() => exportCsv(rows)} style={{ width: "20%", padding: "0 20px" }}>
                  Download as CSV
                </Button>
              </div>
            </>
          )}
          <ReportCharts data={report} node={nodeAddress} />
        </>
      )}
    </PageLayout>
  );
}
