import {
  CHAINS,
  type Chain,
  type ChainHalt,
  type CoinGecko,
  type Countdown,
  type GrabDataResponse,
  type NetworkData,
  type Node,
  type RawNode,
} from "../types";
import { BASE_UNITS } from "../chain";
import { maxVersion } from "./version";

/** Age is still derived from a flat 6s block time, as in the original dashboard. */
const AGE_BLOCK_TIME_SECONDS = 6;
/** Failed churns are retried every 720 blocks. */
const CHURN_RETRY_BLOCKS = 720;

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value as T) ?? fallback;
  try {
    return (JSON.parse(value) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Split a signed number of seconds into days/hours/minutes exactly like the original
 * dashboard's moment.duration(...).days()/hours()/minutes(): whole months are taken out of
 * the days, so e.g. -104 days shows as "-12d" (users are used to these values).
 */
export function toCountdown(totalSeconds: number): Countdown {
  const absCeil = (n: number) => (n < 0 ? Math.floor(n) : Math.ceil(n));
  const minutes = Math.trunc(Math.trunc(totalSeconds) / 60);
  const hours = Math.trunc(minutes / 60);
  const days = Math.trunc(hours / 24);
  const months = Math.trunc((days * 4800) / 146097);
  return { days: days - absCeil((months * 146097) / 4800), hours: hours % 24, minutes: minutes % 60 };
}

export function formatCountdown(c: Countdown): string {
  return `${c.days}d ${c.hours}h ${c.minutes}m`;
}

/** Turn the raw grabData payload into typed nodes plus network-wide figures. */
export function transformNetworkData(raw: GrabDataResponse): NetworkData {
  const rawGlobal = raw.globalData;
  const nodesRaw: RawNode[] = raw.data ?? [];
  // Coerce defensively in case the API ever sends these as strings.
  const g = {
    maxHeight: Number(rawGlobal.maxHeight),
    lastChurn: Number(rawGlobal.lastChurn),
    churnInterval: Number(rawGlobal.churnInterval),
  };
  const secondsPerBlock = Number(rawGlobal.secondsPerBlock);

  const blocksUntilChurn = g.lastChurn + g.churnInterval - g.maxHeight;
  const secondsUntilChurn = blocksUntilChurn * secondsPerBlock;
  const blocksUntilRetry = CHURN_RETRY_BLOCKS + (blocksUntilChurn % CHURN_RETRY_BLOCKS);
  const ratioRewardsAPY = (g.churnInterval - blocksUntilChurn) / g.churnInterval;
  const churnsInYear = 365 / ((secondsPerBlock * g.churnInterval) / 86400);
  const blocksSinceLastChurn = g.maxHeight - g.lastChurn;

  const nodes: Node[] = nodesRaw.map((n) => {
    const providers = parseJson<{ providers?: Node["providers"] }>(n.bond_providers, {}).providers ?? [];
    const observed = parseJson<{ chain: string; height: number }[] | null>(n.observe_chains, null);
    const rawScore = blocksSinceLastChurn / n.slash_points;
    const rawApy = (((n.current_award / ratioRewardsAPY / BASE_UNITS) * churnsInYear) / (n.bond / BASE_UNITS)) * 100;
    return {
      node_address: n.node_address,
      ip_address: n.ip_address,
      isp: n.isp ?? "",
      location: n.location ?? "",
      version: n.version ?? "",
      status: n.status,
      bond: n.bond,
      current_award: n.current_award,
      slash_points: n.slash_points,
      is_jailed: Boolean(n.is_jailed),
      leaving: n.forced_to_leave === 1 || n.requested_to_leave === 1,
      rpcOk: n.rpc !== "null",
      bifrostOk: n.bifrost !== "null",
      bondProvidersString: n.bondProvidersString ?? "",
      providers,
      jail: parseJson(n.jail, null),
      obchains: Object.fromEntries((observed ?? []).map((c) => [c.chain, c.height])),
      age: ((g.maxHeight - n.status_since) * AGE_BLOCK_TIME_SECONDS) / 86400,
      score: Number.isFinite(rawScore) ? Number(rawScore.toFixed(1)) : null,
      apy: Number.isFinite(rawApy) ? rawApy : null,
      action: "-",
    };
  });

  const maxChainHeights: Partial<Record<Chain, number>> = {};
  for (const chain of CHAINS) {
    const heights = nodes.map((n) => n.obchains[chain]).filter((h): h is number => typeof h === "number");
    if (heights.length) maxChainHeights[chain] = Math.max(...heights);
  }

  return {
    nodes,
    maxChainHeights,
    global: {
      maxHeight: g.maxHeight,
      badValidatorRedline: Number(rawGlobal.BadValidatorRedline),
      retiring: rawGlobal.retiring,
      churnTry: secondsUntilChurn < 0,
      timeUntilChurn: toCountdown(secondsUntilChurn),
      timeUntilRetry: toCountdown(blocksUntilRetry * secondsPerBlock),
      maxVersion: maxVersion(nodes.map((n) => n.version)),
      coingecko: parseJson<CoinGecko[]>(rawGlobal.coingecko, [])[0] ?? null,
      halts: parseJson<Record<string, ChainHalt>>(rawGlobal.halts, {}),
    },
  };
}
