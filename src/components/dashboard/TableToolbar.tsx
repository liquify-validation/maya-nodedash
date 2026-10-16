import { useEffect, useMemo, useState } from "react";
import type { ChartData, ChartOptions } from "chart.js";
import { api } from "../../api/client";
import { icons } from "../../assets";
import { useTheme } from "../../hooks/theme";
import type { ColumnKey, VisibleColumns } from "../../types";
import { DoughnutChart } from "../charts/Charts";
import { AffixInput } from "../ui/Basic";
import { Button, ButtonLink } from "../ui/Button";
import { SearchOutlined } from "../ui/icons";
import { Modal } from "../ui/Modal";
import { Switch } from "../ui/Switch";

/** Columns users can toggle in the "Visible columns" dialog (two columns of switches). */
const TOGGLEABLE: { key: ColumnKey; label: string }[] = [
  { key: "nodes", label: "Nodes" },
  { key: "age", label: "Age" },
  { key: "action", label: "Action" },
  { key: "isp", label: "ISP" },
  { key: "bond", label: "Bond" },
  { key: "providers", label: "Providers" },
  { key: "rewards", label: "Rewards" },
  { key: "apy", label: "APY" },
  { key: "slashes", label: "Slashes" },
  { key: "score", label: "Score" },
  { key: "version", label: "Version" },
  { key: "rpc", label: "RPC" },
  { key: "bfr", label: "BFR" },
];

const LOCATION_COLOURS = [
  "#003f5c", "#2f4b7c", "#665191", "#a05195", "#d45087", "#f95d6a", "#ff7c43", "#ffa600", "#00876c", "#439981", "#6aaa96",
  "#8cbcac", "#aecdc2", "#cfdfd9", "#ee7d4f", "#f1d4d4", "#f0b8b8", "#ec9c9d", "#e67f83", "#de6069", "#633EBB",
];
const VERSION_COLOURS = ["#FD4E5D", "#B3CEE2", "#1C39BB"];

interface ToolbarProps {
  /** Section button; links to the section's own page when `to` is set. */
  title: string;
  to?: string;
  /** Search + column settings are shown on the first visible section only. */
  controls?: {
    search: string;
    onSearch: (term: string) => void;
    columns: VisibleColumns;
    onColumnsChange: (columns: VisibleColumns) => void;
  };
}

export function TableToolbar({ title, to, controls }: ToolbarProps) {
  return (
    <div className="cta-wrapper">
      <div className="cta-link">
        {to ? (
          <ButtonLink to={to} className="uppercase">
            {title}
          </ButtonLink>
        ) : (
          <Button type="primary" className="uppercase">
            {title}
          </Button>
        )}
      </div>
      {controls && (
        <>
          <div className="search-input">
            <AffixInput
              ariaLabel="Search by node or bond provider address"
              value={controls.search}
              onChange={controls.onSearch}
              prefix={<SearchOutlined />}
              style={{ width: 500, height: 46, borderRadius: 6, background: "#fff" }}
            />
          </div>
          <TableSettings columns={controls.columns} onColumnsChange={controls.onColumnsChange} />
        </>
      )}
    </div>
  );
}

type Dialog = "columns" | "locations" | "versions" | null;

function TableSettings({ columns, onColumnsChange }: { columns: VisibleColumns; onColumnsChange: (c: VisibleColumns) => void }) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [draft, setDraft] = useState(columns);
  const close = () => setDialog(null);

  const openColumns = () => {
    setDraft(columns);
    setDialog("columns");
  };

  return (
    <div>
      <Button type="secondary" className="button-filter" onClick={openColumns} aria-label="Visible columns">
        <img src={icons.filterIcon} alt="" />
      </Button>
      <Button type="secondary" className="button-filter" onClick={() => setDialog("locations")} aria-label="Node locations">
        <img src={icons.globeIcon} alt="" />
      </Button>
      <Button type="secondary" className="button-filter" onClick={() => setDialog("versions")} aria-label="Node versions">
        <img src={icons.versionIcon} alt="" />
      </Button>

      <Modal
        title="VISIBLE COLUMNS"
        okText="Confirm"
        open={dialog === "columns"}
        onOk={() => {
          onColumnsChange(draft);
          close();
        }}
        onCancel={close}
        wrapClassName="filter-modal"
      >
        <div className="filter-list">
          {TOGGLEABLE.map(({ key, label }) => (
            <div className="filter-item" key={key}>
              <span>{label}</span>
              <Switch label={label} checked={draft[key]} onChange={(checked) => setDraft((d) => ({ ...d, [key]: checked }))} />
            </div>
          ))}
        </div>
      </Modal>

      <DistributionModal title="Locations" open={dialog === "locations"} onClose={close} load={api.locations} colours={LOCATION_COLOURS} />
      <DistributionModal title="Versions" open={dialog === "versions"} onClose={close} load={api.versions} colours={VERSION_COLOURS} />
    </div>
  );
}

/** Doughnut chart of node counts (by location or version), fetched when first opened. */
function DistributionModal({
  title,
  open,
  onClose,
  load,
  colours,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  load: () => Promise<Record<string, number>>;
  colours: string[];
}) {
  const { theme } = useTheme();
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFailed(false);
    load()
      .then((c) => !cancelled && setCounts(c))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [open, load]);

  const data = useMemo<ChartData<"doughnut"> | null>(
    () => (counts ? { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: colours }] } : null),
    [counts, colours]
  );
  const options = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      aspectRatio: 2,
      cutout: "50%",
      animation: { animateScale: true, animateRotate: true },
      plugins: { legend: { display: true, labels: { color: theme === "light" ? "black" : "white", padding: 10 } } },
    }),
    [theme]
  );

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      wrapClassName="pie-modal"
      footer={
        <Button type="default" onClick={onClose}>
          Close
        </Button>
      }
    >
      {failed ? <p>Error loading data</p> : data ? <DoughnutChart data={data} options={options} /> : <p>Loading...</p>}
    </Modal>
  );
}
