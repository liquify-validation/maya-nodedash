import { useState, type CSSProperties, type ReactNode } from "react";
import { chainIcons, icons } from "../../assets";
import { UNIT } from "../../chain";
import { CHAINS, type Chain, type ChainHalt, type ColumnKey, type Node, type SortDirection, type SortKey, type VisibleColumns } from "../../types";
import { ExclamationCircleOutlined, LeftOutlined, RightOutlined } from "../ui/icons";
import { Popover } from "../ui/Popover";
import { Select } from "../ui/Select";
import { cx } from "../ui/util";
import { NodeRow } from "./NodeRow";

// Inline styles are kept from the original table: they deliberately win over the stylesheet
// (e.g. header text stays white on hover).
export const headerCellStyle: CSSProperties = {
  cursor: "pointer",
  padding: "12px 15px",
  fontSize: 15,
  color: "#ffffff",
  height: 55,
  fontWeight: 600,
  textAlign: "center",
};
const chainHeaderStyle: CSSProperties = { ...headerCellStyle, minWidth: 25, padding: "5px 10px" };
const flexCenter: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center" };

const leaveIcon = (
  <svg style={{ marginTop: 5 }} focusable="false" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="20" height="20" viewBox="0 0 30 30" aria-label="Leaving" role="img">
    <path d="M6,30H18a2.0023,2.0023,0,0,0,2-2V25H18v3H6V4H18V7h2V4a2.0023,2.0023,0,0,0-2-2H6A2.0023,2.0023,0,0,0,4,4V28A2.0023,2.0023,0,0,0,6,30Z" />
    <path d="M20.586 20.586L24.172 17 10 17 10 15 24.172 15 20.586 11.414 22 10 28 16 22 22 20.586 20.586z" />
  </svg>
);

/** Fixed columns in display order; RPC/BFR are not sortable. */
const COLUMNS: { key: ColumnKey; label: ReactNode; sortKey?: SortKey }[] = [
  { key: "nodes", label: "Validator Nodes", sortKey: "node_address" },
  { key: "age", label: "Age", sortKey: "age" },
  { key: "action", label: "Action", sortKey: "action" },
  { key: "isp", label: "ISP", sortKey: "isp" },
  { key: "location", label: "Location", sortKey: "location" },
  { key: "bond", label: <>Bond <br />({UNIT})</>, sortKey: "bond" },
  { key: "providers", label: "Providers", sortKey: "bond_providers" },
  { key: "rewards", label: <>Rewards <br />({UNIT})</>, sortKey: "current_award" },
  { key: "apy", label: "APY", sortKey: "apy" },
  { key: "slashes", label: "Slashes", sortKey: "slash_points" },
  { key: "score", label: "Score", sortKey: "score" },
  { key: "version", label: "Version", sortKey: "version" },
  { key: "leave", label: leaveIcon, sortKey: "leave" },
  { key: "jailed", label: "Jailed", sortKey: "jailed" },
  { key: "rpc", label: "RPC" },
  { key: "bfr", label: "BFR" },
];

const isChainKey = (key: ColumnKey) => (CHAINS as readonly string[]).includes(key);

/** 0 means "All". */
const PAGE_SIZES = [...[10, 25, 50, 100].map((n) => ({ value: n, label: String(n) })), { value: 0, label: "All" }];

/** Header min-widths used by the standby/other pages, which kept an older header layout. */
const LEGACY_MIN_WIDTH: Partial<Record<ColumnKey, number>> = { nodes: 100, age: 90, action: 100, isp: 50, location: 100, bond: 75 };

export interface NodeTableProps {
  nodes: Node[];
  /** Show the per-chain sync columns (active table only). */
  showChains: boolean;
  /** Standby/other pages: original older header layout (fixed min-widths, inline sort arrow). */
  legacyLayout?: boolean;
  /** Row numbers are centred on the overview and left-aligned on the per-status pages. */
  centerIndex?: boolean;
  visibleColumns: VisibleColumns;
  sortBy: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  maxChainHeights: Partial<Record<Chain, number>>;
  halts: Record<string, ChainHalt>;
  runePrice: number;
  favourites: string[];
  onToggleFavourite: (address: string) => void;
}

function SortIcon({ active, direction, legacy }: { active: boolean; direction: SortDirection; legacy?: boolean }) {
  if (!active) return null;
  // The legacy header positions the arrow absolutely via the .asc/.desc classes.
  const cls = legacy ? direction : direction === "desc" ? "down" : "up";
  return <img className={`sort-icon ${cls}`} src={icons.arrowDownIcon} width={12} alt={direction === "desc" ? "sorted descending" : "sorted ascending"} />;
}

function haltMessage(h: ChainHalt | undefined): string | null {
  if (!h) return null;
  const msgs = [h.SIGNING === 1 && "Signing is Halted", h.TRADING === 1 && "Trading is Halted", h.CHAIN === 1 && "Chain is Halted"].filter(Boolean);
  return msgs.length ? msgs.join(", ") : null;
}

export function NodeTable(props: NodeTableProps) {
  const { nodes, showChains, legacyLayout, visibleColumns, sortBy, sortDirection, onSort, halts } = props;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const size = pageSize || Math.max(1, nodes.length);
  const totalPages = Math.max(1, Math.ceil(nodes.length / size));
  const current = Math.min(page, totalPages);
  const first = (current - 1) * size;
  const pageNodes = nodes.slice(first, first + size);
  const hidden = (key: ColumnKey) => !visibleColumns[key];

  const sortableHeader = (key: ColumnKey, sortKey: SortKey, label: ReactNode, style: CSSProperties = headerCellStyle) => {
    const active = sortBy === sortKey;
    const legacy = legacyLayout && key !== "jailed";
    return (
      <th
        key={key}
        className={cx("tableHeader", hidden(key) && "hidden")}
        style={legacy ? { ...style, minWidth: LEGACY_MIN_WIDTH[key] } : style}
        onClick={() => onSort(sortKey)}
        aria-sort={active ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
      >
        {legacy ? (
          <span>
            {label}
            <SortIcon active={active} direction={sortDirection} legacy />
          </span>
        ) : (
          <div style={flexCenter}>
            {isChainKey(key) ? label : <span style={{ marginRight: "5px" }}>{label}</span>}
            <SortIcon active={active} direction={sortDirection} />
          </div>
        )}
      </th>
    );
  };

  return (
    <>
      <div className="item-to-show">
        <span>Nodes per page:</span>
        <Select
          value={pageSize}
          options={PAGE_SIZES}
          onChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          style={{ width: 80, borderRadius: 10 }}
        />
      </div>
      <div className="data-table-wrapper">
        <div style={{ width: "100%" }}>
          <table style={{ borderWidth: 1.1, borderColor: "rgba(0,0,0,1)", width: "100%" }}>
            <thead>
              <tr style={{ borderStyle: "solid", borderWidth: 1.1, borderColor: "rgba(0,0,0,1)", color: "black", textAlign: "center", marginRight: 10 }}>
                <th />
                {COLUMNS.map((c) =>
                  c.sortKey ? (
                    sortableHeader(c.key, c.sortKey, c.label)
                  ) : (
                    <th key={c.key} className={cx("tableHeader", hidden(c.key) && "hidden")} style={headerCellStyle}>
                      {c.label}
                    </th>
                  )
                )}
                {showChains &&
                  CHAINS.map((chain) => {
                    const halt = haltMessage(halts[chain]);
                    return sortableHeader(
                      chain,
                      chain,
                      <>
                        <img alt={chain} src={chainIcons[chain]} style={{ width: 25, height: 25, display: "block", marginRight: "5px" }} />
                        {halt && (
                          <Popover content={halt} title="Warning">
                            <ExclamationCircleOutlined style={{ position: "absolute", marginLeft: "25px", color: "red", fontSize: "15px" }} />
                          </Popover>
                        )}
                      </>,
                      chainHeaderStyle
                    );
                  })}
              </tr>
            </thead>
            <tbody>
              {pageNodes.map((node, i) => (
                <NodeRow key={node.node_address} index={first + i + 1} node={node} {...props} />
              ))}
            </tbody>
          </table>
        </div>
        <Paging current={current} totalPages={totalPages} onChange={setPage} />
      </div>
    </>
  );
}

function Paging({ current, totalPages, onChange }: { current: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <nav className="paging-wrapper" aria-label="Table pages">
      <ul className="page-numbers">
        <li className={cx("nav-button nav-button--prev", current === 1 && "disabled")} onClick={() => onChange(Math.max(1, current - 1))} aria-label="Previous page">
          <LeftOutlined />
        </li>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <li key={n} className={cx("paging-item", current === n && "active")} onClick={() => onChange(n)} aria-current={current === n ? "page" : undefined}>
            {n}
          </li>
        ))}
        <li className={cx("nav-button nav-button--next", current === totalPages && "disabled")} onClick={() => onChange(Math.min(totalPages, current + 1))} aria-label="Next page">
          <RightOutlined />
        </li>
      </ul>
    </nav>
  );
}
