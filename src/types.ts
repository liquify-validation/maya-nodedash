export type Theme = "light" | "dark";

import { CHAINS } from "./chain";

export { CHAINS };
export type Chain = (typeof CHAINS)[number];

export interface BondProvider {
  bond_address: string;
  bond: string;
}

export interface JailInfo {
  release_height?: number;
  reason?: string;
}

export interface ObservedChain {
  chain: string;
  height: number;
}

/** A node row as returned by grabData (several fields are JSON encoded strings). */
export interface RawNode {
  node_address: string;
  ip_address: string;
  isp: string | null;
  location: string | null;
  version: string;
  status: string;
  status_since: number;
  bond: number;
  current_award: number;
  slash_points: number;
  is_jailed: number;
  forced_to_leave: number;
  requested_to_leave: number;
  rpc: string;
  bifrost: string;
  bondProvidersString: string;
  bond_providers: string;
  jail: string;
  observe_chains: string;
}

export interface CoinGecko {
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  total_supply: number;
}

export interface ChainHalt {
  SIGNING: number;
  TRADING: number;
  CHAIN: number;
}

export interface RawGlobalData {
  maxHeight: number | string;
  lastChurn: number | string;
  churnInterval: number | string;
  secondsPerBlock: number | string;
  retiring: number | string | boolean;
  BadValidatorRedline: number | string;
  coingecko: string;
  halts?: string | Record<string, ChainHalt>;
}

export interface GrabDataResponse {
  data: RawNode[];
  globalData: RawGlobalData;
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
}

export interface Node {
  node_address: string;
  ip_address: string;
  isp: string;
  location: string;
  version: string;
  status: string;
  bond: number;
  current_award: number;
  slash_points: number;
  is_jailed: boolean;
  leaving: boolean;
  rpcOk: boolean;
  bifrostOk: boolean;
  bondProvidersString: string;
  providers: BondProvider[];
  jail: JailInfo | null;
  /** Observed height per chain. */
  obchains: Partial<Record<string, number>>;
  /** Days since status_since. */
  age: number;
  /** Blocks since last churn / slash points; null when the node has no slashes. */
  score: number | null;
  /** Annualised yield in percent; null when it can't be computed (e.g. zero bond). */
  apy: number | null;
  /** Churn hint ("Oldest", "Churn In", ...) or "-". */
  action: string;
}

export interface GlobalData {
  maxHeight: number;
  badValidatorRedline: number;
  /** Raw API value; the churn tile compares it to the strings "true"/"false" as the original did. */
  retiring: number | string | boolean;
  churnTry: boolean;
  timeUntilChurn: Countdown;
  timeUntilRetry: Countdown;
  maxVersion: string;
  coingecko: CoinGecko | null;
  halts: Record<string, ChainHalt>;
}

export interface NetworkData {
  nodes: Node[];
  global: GlobalData;
  maxChainHeights: Partial<Record<Chain, number>>;
}

export type SortKey =
  | "node_address"
  | "age"
  | "action"
  | "isp"
  | "location"
  | "bond"
  | "bond_providers"
  | "current_award"
  | "apy"
  | "slash_points"
  | "score"
  | "version"
  | "leave"
  | "jailed"
  | Chain;

export type SortDirection = "asc" | "desc";

export const COLUMN_KEYS = [
  "nodes",
  "age",
  "action",
  "isp",
  "location",
  "bond",
  "providers",
  "rewards",
  "apy",
  "slashes",
  "score",
  "version",
  "leave",
  "jailed",
  "rpc",
  "bfr",
  ...CHAINS,
] as const;
export type ColumnKey = (typeof COLUMN_KEYS)[number];
export type VisibleColumns = Record<ColumnKey, boolean>;

export const DEFAULT_COLUMNS = Object.fromEntries(COLUMN_KEYS.map((k) => [k, true])) as VisibleColumns;
