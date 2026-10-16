/**
 * Everything that is specific to MAYAChain. The rest of the app is shared with the
 * THORChain classic dashboard (thornode-network-classic).
 */

export const API_BASE = "https://maya-api.liquify.com/maya/api";

/** CACAO amounts from the API are in 1e10 base units. */
export const BASE_UNITS = 1e10;
export const UNIT = "CACAO";

/** Whole-CACAO amount formatted the way the original dashboard showed it ("1,234 CACAO"). */
export const formatAmount = (whole: number | string | undefined) => `${whole?.toLocaleString() ?? ""} ${UNIT}`;

/** Axis label suffix for charts, e.g. "Bond Amount (CACAO)". */
export const unitLabel = (label: string) => `${label} (${UNIT})`;

/** Chains shown as height-delta columns on the active node table, in display order. */
export const CHAINS = ["DASH", "BTC", "ETH", "THOR", "KUJI", "ARB", "XRD", "ZEC"] as const;

export const explorer = {
  address: (a: string) => `https://www.mayascan.org/address/${a}`,
  node: (a: string) => `https://mayanode.mayachain.info/mayachain/node/${a}`,
  nodeLabel: "Maya API",
  addressTitle: "Maya Address",
};

/** Divisor the original dashboard applied to grabRewardsAvg for its "Average / 100 Blocks" chart. */
export const REWARDS_AVG_DIVISOR = 1e7;

/** Upper bound of the y axis on "Performance Over Time" charts (fewer nodes than THORChain). */
export const POSITION_CHART_MAX = 40;

/** Standby nodes need this bond (base units, i.e. 3,000 CACAO) to be shown as "Churn In" candidates. */
export const CHURN_IN_MIN_BOND = 30_000_000_000_000;

/** MAYAChain doesn't publish a bad-validator redline (the API returns null), so that label is off. */
export const SHOW_BAD_REDLINE = false;
