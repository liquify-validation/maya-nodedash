import { Fragment, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { NodeTable } from "../components/dashboard/NodeTable";
import { OverviewStats } from "../components/dashboard/OverviewStats";
import { TableToolbar } from "../components/dashboard/TableToolbar";
import { Loading, PageLayout, type NodeFilter } from "../components/layout/PageLayout";
import { Breadcrumb, type Crumb } from "../components/ui/Basic";
import { useFavourites } from "../hooks/favourites";
import { useNetworkData } from "../hooks/networkData";
import { groupNodes, pinFavourites, searchNodes, sortNodes, type NodeGroups } from "../lib/nodes";
import { DEFAULT_COLUMNS, type Node, type SortDirection, type SortKey } from "../types";

export type DashboardView = "overview" | "active" | "standby" | "other";

interface Section {
  group: keyof NodeGroups;
  filter: NodeFilter;
  title: string;
  /** Button label on the section's own page. */
  pageTitle: string;
  path: string;
  emptyText: string;
  showChains: boolean;
  /** Favourites float to the top of this table. */
  pinFavourites: boolean;
}

const SECTIONS: Section[] = [
  { group: "active", filter: "active", title: "Active nodes", pageTitle: "Active Nodes", path: "/active-dashboard", emptyText: "No Active Data Available!", showChains: true, pinFavourites: true },
  { group: "standby", filter: "standby", title: "Standby nodes", pageTitle: "Standby Nodes", path: "/standby-dashboard", emptyText: "No Standby Data Available!", showChains: false, pinFavourites: false },
  { group: "other", filter: "others", title: "Other nodes", pageTitle: "Other Nodes", path: "/other-dashboard", emptyText: "No Other Data Available!", showChains: false, pinFavourites: false },
];

const DASHBOARD_CRUMB: Crumb = { label: "Dashboard", to: "/" };
const VIEWS: Record<DashboardView, { breadcrumb: Crumb[]; single?: Section }> = {
  overview: { breadcrumb: [{ label: "Dashboard" }] },
  active: { breadcrumb: [DASHBOARD_CRUMB, { label: "Active Nodes", current: true }] },
  standby: { breadcrumb: [DASHBOARD_CRUMB, { label: "Standby Nodes", current: true }], single: SECTIONS[1] },
  other: { breadcrumb: [DASHBOARD_CRUMB, { label: "Other Nodes", current: true }], single: SECTIONS[2] },
};

const NO_FILTERS: Record<NodeFilter, boolean> = { active: false, standby: false, others: false };

/**
 * One page component for the overview and the per-status dashboards. The overview (and the
 * active dashboard, which mirrors it) shows all three tables, filterable from the header;
 * the standby/other dashboards show a single table.
 */
export function DashboardPage({ view }: { view: DashboardView }) {
  const { data } = useNetworkData();
  const { favourites, toggleFavourite } = useFavourites();
  const navigate = useNavigate();
  const location = useLocation();
  const config = VIEWS[view];

  const [filters, setFilters] = useState<Record<NodeFilter, boolean>>(() => ({ ...NO_FILTERS, ...(location.state as { filters?: Record<NodeFilter, boolean> } | null)?.filters }));
  const [search, setSearch] = useState("");
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [sortBy, setSortBy] = useState<SortKey>("bond");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const groups = useMemo(() => (data ? groupNodes(data.nodes, data.global) : null), [data]);

  const toggleFilter = (f: NodeFilter) => {
    const next = { ...filters, [f]: !filters[f] };
    // Single-table pages have nothing to filter, so apply the filter on the overview instead.
    if (config.single) navigate("/", { state: { filters: next } });
    else setFilters(next);
  };

  const onSort = (key: SortKey) => {
    setSortDirection(sortBy !== key ? "desc" : sortDirection === "desc" ? "asc" : "desc");
    setSortBy(key);
  };

  const anyFilter = filters.active || filters.standby || filters.others;
  const sections = config.single ? [config.single] : SECTIONS.filter((s) => !anyFilter || filters[s.filter]);

  const tableRows = (section: Section): Node[] => {
    if (!groups || !data) return [];
    const sorted = sortNodes(searchNodes(groups[section.group], search), sortBy, sortDirection, data.maxChainHeights);
    return section.pinFavourites ? pinFavourites(sorted, favourites) : sorted;
  };

  return (
    <PageLayout filters={{ active: filters, onToggle: toggleFilter }}>
      {!data || !groups ? (
        <Loading />
      ) : (
        <div className="layout-content-wrapper">
          <Breadcrumb items={config.breadcrumb} />
          <OverviewStats global={data.global} totalActiveBond={groups.active.reduce((sum, n) => sum + n.bond, 0)} />

          {sections.map((section, i) => {
            const rows = tableRows(section);
            return (
              <Fragment key={section.group}>
                <TableToolbar
                  title={config.single ? section.pageTitle : section.title}
                  to={config.single ? undefined : section.path}
                  controls={i === 0 ? { search, onSearch: setSearch, columns, onColumnsChange: setColumns } : undefined}
                />
                {rows.length > 0 ? (
                  <NodeTable
                    nodes={rows}
                    showChains={section.showChains}
                    legacyLayout={Boolean(config.single)}
                    centerIndex={view === "overview"}
                    visibleColumns={columns}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    maxChainHeights={data.maxChainHeights}
                    halts={data.global.halts}
                    runePrice={data.global.coingecko?.current_price ?? 0}
                    favourites={favourites}
                    onToggleFavourite={toggleFavourite}
                  />
                ) : (
                  <div className="no-data">
                    <div className="no-data__content">{section.emptyText}</div>
                  </div>
                )}
                {!config.single && section.group !== "other" && <br />}
              </Fragment>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
