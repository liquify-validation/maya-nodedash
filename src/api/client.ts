import { API_BASE } from "../chain";
import type { GrabDataResponse } from "../types";

export class ApiError extends Error {}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, { signal });
  if (!res.ok) throw new ApiError(`${path.split("=")[0]} failed (${res.status})`);
  return (await res.json()) as T;
}

const nodeParam = (address: string) => encodeURIComponent(address);

export const api = {
  grabData: (signal?: AbortSignal) => getJson<GrabDataResponse>("grabData", signal),
  locations: () => getJson<Record<string, number>>("locations"),
  versions: () => getJson<Record<string, number>>("versions"),
  totalBond: () => getJson<Record<string, number>>("totalBond"),
  bond: (node: string) => getJson<Record<string, number>>(`grabBond=${nodeParam(node)}`),
  rewards: (node: string) => getJson<Record<string, number>>(`grabRewards=${nodeParam(node)}`),
  rewardsAvg: (node: string) => getJson<Record<string, number>>(`grabRewardsAvg=${nodeParam(node)}`),
  slashes: (node: string) => getJson<Record<string, number>>(`grabSlashes=${nodeParam(node)}`),
  slashesAvg: (node: string) => getJson<Record<string, number>>(`grabSlashesAvg=${nodeParam(node)}`),
  position: (node: string) => getJson<Record<string, { max: number; position: number }>>(`grabPosition=${nodeParam(node)}`),
  churnsForNode: (node: string) => getJson<{ churnHeight: number; date: string }[]>(`grabChurnsForNode=${nodeParam(node)}`),

  async generateReport(body: { start: number; end: number; node: string }): Promise<ReportResponse> {
    const res = await fetch(`${API_BASE}/generateReport`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new ApiError(`HTTP error! Status: ${res.status}`);
    return (await res.json()) as ReportResponse;
  },
};

export interface ReportResponse {
  startBlock: number;
  endBlock: number;
  startBond: number;
  endBond: number;
  BondIncrease: number;
  position: number;
  maxPosition: number;
  totalRewards: number;
  graphData?: {
    Xticks: number[];
    bond: number[];
    maxPosition: number[];
    position: number[];
    rewards: number[];
  };
  tableData: {
    churnHeight: number[];
    date: string[];
    price: (string | number)[];
    rewards: (string | number)[];
    dollarValue: (string | number)[];
  };
}
