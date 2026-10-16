import { CHURN_IN_MIN_BOND, SHOW_BAD_REDLINE } from "../chain";
import type { Chain, GlobalData, Node, SortDirection, SortKey } from "../types";
import { CHAINS } from "../types";
import { compareVersions } from "./version";

const CHURN_IN_SLOTS = 5;
/** Nodes younger than this (days) can't be churned out for bad performance. */
const WORST_PERFORMER_MIN_AGE_DAYS = 3;
const REDLINE_MIN_SLASHES = 100;

export interface NodeGroups {
  active: Node[];
  standby: Node[];
  other: Node[];
}

const byAddress = (a: Node, b: Node) => a.node_address.localeCompare(b.node_address);

/** Lower is worse; nodes without slashes have no score and count as the best performers. */
const scoreValue = (n: Node) => n.score ?? Infinity;

/**
 * Split nodes into the three tables and label the churn candidates:
 * active nodes get Oldest / Smallest Bond / Worst Performing / Bad Redline,
 * the top bonded eligible standby nodes get "Churn In".
 */
export function groupNodes(nodes: Node[], global: GlobalData): NodeGroups {
  const labelled = nodes.map((n) => ({ ...n, action: "-" }));
  const active = labelled.filter((n) => n.status === "Active");
  const standby = labelled.filter(
    (n) => (n.status === "Standby" || n.status === "Ready") && n.version === global.maxVersion
  );
  const grouped = new Set([...active, ...standby]);
  const other = labelled.filter((n) => !grouped.has(n));

  labelChurnOuts(active, global.badValidatorRedline);
  labelChurnIns(standby);
  return { active, standby, other };
}

function labelChurnOuts(active: Node[], badValidatorRedline: number) {
  if (active.length === 0) return;

  const oldest = active.reduce((best, n) => (n.age > best.age || (n.age === best.age && byAddress(n, best) > 0) ? n : best));
  oldest.action = "Oldest";

  const smallest = active.reduce((best, n) => (n.bond < best.bond || (n.bond === best.bond && byAddress(n, best) < 0) ? n : best));
  smallest.action = "Smallest Bond";

  const eligible = active.filter((n) => n.age > WORST_PERFORMER_MIN_AGE_DAYS);
  if (eligible.length > 0) {
    const worst = eligible.reduce((best, n) =>
      scoreValue(n) < scoreValue(best) || (scoreValue(n) === scoreValue(best) && n.bond > best.bond) ? n : best
    );
    worst.action = "Worst Performing";
  }

  if (!SHOW_BAD_REDLINE || !Number.isFinite(badValidatorRedline)) return;

  // Bad validator redline: average score of heavily slashed nodes, scaled by the network constant.
  const slashed = active.filter((n) => n.slash_points > REDLINE_MIN_SLASHES);
  const averageScore = slashed.reduce((sum, n) => sum + scoreValue(n), 0) / (slashed.length + 1);
  const redline = averageScore / badValidatorRedline;
  for (const n of active) {
    if (n.score !== null && n.score < redline) n.action = "Bad Redline";
  }
}

function labelChurnIns(standby: Node[]) {
  standby
    .filter((n) => n.bond >= CHURN_IN_MIN_BOND)
    .sort((a, b) => b.bond - a.bond || byAddress(b, a))
    .slice(0, CHURN_IN_SLOTS)
    .forEach((n) => (n.action = "Churn In"));
}

/** Case-insensitive match on node address or any bond provider address. */
export function searchNodes(nodes: Node[], term: string): Node[] {
  const t = term.trim().toLowerCase();
  if (!t) return nodes;
  return nodes.filter((n) => n.node_address.includes(t) || n.bondProvidersString.includes(t));
}

const isChain = (key: SortKey): key is Chain => (CHAINS as readonly string[]).includes(key);

/** Chain sync delta vs the network max; missing data sorts as the furthest behind. */
export function chainDelta(node: Node, chain: Chain, maxChainHeights: Partial<Record<Chain, number>>): number {
  const height = node.obchains[chain];
  const max = maxChainHeights[chain];
  return height === undefined || max === undefined ? -Infinity : height - max;
}

function compareBy(key: SortKey, maxChainHeights: Partial<Record<Chain, number>>): (a: Node, b: Node) => number {
  if (isChain(key)) return (a, b) => chainDelta(a, key, maxChainHeights) - chainDelta(b, key, maxChainHeights) || 0;
  switch (key) {
    case "node_address":
    case "isp":
    case "location":
    case "action":
      return (a, b) => a[key].localeCompare(b[key]);
    case "version":
      return (a, b) => compareVersions(a.version, b.version);
    case "bond_providers":
      return (a, b) => a.providers.length - b.providers.length;
    case "jailed":
      return (a, b) => Number(a.is_jailed) - Number(b.is_jailed);
    case "leave":
      return (a, b) => Number(a.leaving) - Number(b.leaving);
    case "score":
      return (a, b) => scoreValue(a) - scoreValue(b) || 0;
    case "apy":
      return (a, b) => (a.apy ?? -Infinity) - (b.apy ?? -Infinity) || 0;
    default:
      return (a, b) => a[key] - b[key];
  }
}

/** Sort ascending by key (ties broken by node address), then reverse for descending. */
export function sortNodes(
  nodes: Node[],
  key: SortKey,
  direction: SortDirection,
  maxChainHeights: Partial<Record<Chain, number>>
): Node[] {
  const cmp = compareBy(key, maxChainHeights);
  const sorted = [...nodes].sort((a, b) => cmp(a, b) || byAddress(a, b));
  return direction === "desc" ? sorted.reverse() : sorted;
}

/** Move favourite nodes to the top, keeping the existing order within each part. */
export function pinFavourites(nodes: Node[], favourites: string[]): Node[] {
  const fav = new Set(favourites);
  return [...nodes.filter((n) => fav.has(n.node_address)), ...nodes.filter((n) => !fav.has(n.node_address))];
}
