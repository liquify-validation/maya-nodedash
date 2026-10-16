import { describe, expect, it } from "vitest";
import raw from "./__fixtures__/grabData.json";
import { formatCountdown, toCountdown, transformNetworkData } from "./network";
import { groupNodes, pinFavourites, searchNodes, sortNodes } from "./nodes";
import { compareVersions, maxVersion } from "./version";
import type { GrabDataResponse, Node } from "../types";

const data = transformNetworkData(raw as unknown as GrabDataResponse);

describe("compareVersions", () => {
  it("compares numerically, not lexically", () => {
    expect(compareVersions("3.20.3", "3.9.0")).toBeGreaterThan(0);
    expect(compareVersions("3.20.3", "3.20.3")).toBe(0);
    expect(compareVersions("3.21.0-rc1", "3.21.0")).toBeLessThan(0);
    expect(maxVersion(["3.9.0", "3.20.3", "3.20.10"])).toBe("3.20.10");
  });
});

describe("transformNetworkData", () => {
  it("parses JSON-encoded fields and derives per-node figures", () => {
    const n = data.nodes.find((x) => x.node_address === "maya122w0nuvckgwq2ngw57xn82w8ygl3nn0xy6wu7n")!;
    expect(n.providers).toHaveLength(2);
    expect(n.jail?.reason).toBe("failed to perform keysign");
    expect(n.obchains.BTC).toBe(945517);
    // Same formulas as the original dashboard.
    const maxHeight = Number(raw.globalData.maxHeight);
    expect(n.age).toBeCloseTo(((maxHeight - 15454656) * 6) / 86400);
    expect(n.score).toBe(Number(((maxHeight - Number(raw.globalData.lastChurn)) / 6283).toFixed(1)));
    expect(n.apy).toBeGreaterThanOrEqual(0);
  });

  it("keeps the raw retiring flag and computes the churn countdowns", () => {
    expect(data.global.retiring).toBe(0);
    const g = raw.globalData;
    const blocksUntil = Number(g.lastChurn) + Number(g.churnInterval) - Number(g.maxHeight);
    expect(Math.abs(data.global.timeUntilRetry.days)).toBeLessThan(1);
    expect(data.global.churnTry).toBe(blocksUntil < 0);
    expect(data.global.coingecko?.current_price).toBeGreaterThan(0);
  });

  it("takes the max observed height per chain", () => {
    const btc = Math.max(...data.nodes.map((n) => n.obchains.BTC ?? 0));
    expect(data.maxChainHeights.BTC).toBe(btc);
  });

  it("splits countdowns like moment.duration did", () => {
    expect(formatCountdown(toCountdown(-40440))).toBe("0d -11h -14m");
    expect(formatCountdown(toCountdown(90061))).toBe("1d 1h 1m");
    // Whole months are removed from the days: -104 days -> "-12d 0h -33m".
    expect(formatCountdown(toCountdown(-8987639.4))).toBe("-12d 0h -33m");
  });
});

describe("groupNodes", () => {
  const groups = groupNodes(data.nodes, data.global);

  it("puts every node in exactly one table", () => {
    expect(groups.active.length + groups.standby.length + groups.other.length).toBe(data.nodes.length);
    expect(groups.active.every((n) => n.status === "Active")).toBe(true);
    expect(groups.standby.every((n) => n.version === data.global.maxVersion)).toBe(true);
  });

  it("labels churn-out candidates among active nodes", () => {
    const actions = groups.active.map((n) => n.action);
    expect(actions.filter((a) => a === "Worst Performing").length).toBeLessThanOrEqual(1);
    const smallest = [...groups.active].sort((a, b) => a.bond - b.bond)[0];
    expect(["Smallest Bond", "Worst Performing", "Bad Redline"]).toContain(smallest.action);
  });

  it("marks at most five eligible standby nodes to churn in", () => {
    const churnIn = groups.standby.filter((n) => n.action === "Churn In");
    expect(churnIn.length).toBeLessThanOrEqual(5);
    expect(churnIn.every((n) => n.bond >= 30_000_000_000_000)).toBe(true);
  });

  it("never labels Bad Redline (MAYAChain has no redline constant)", () => {
    expect(groups.active.some((n) => n.action === "Bad Redline")).toBe(false);
  });

  it("does not mutate the input nodes", () => {
    expect(data.nodes.every((n) => n.action === "-")).toBe(true);
  });
});

describe("sorting and filtering", () => {
  const node = (address: string, extra: Partial<Node> = {}): Node =>
    ({ ...data.nodes[0], node_address: address, ...extra }) as Node;

  it("sorts scores numerically and nodes without slashes last when ascending", () => {
    const nodes = [node("a", { score: 9.5 }), node("b", { score: 13.4 }), node("c", { score: null })];
    expect(sortNodes(nodes, "score", "asc", {}).map((n) => n.node_address)).toEqual(["a", "b", "c"]);
    expect(sortNodes(nodes, "score", "desc", {}).map((n) => n.node_address)).toEqual(["c", "b", "a"]);
  });

  it("breaks ties by address", () => {
    const nodes = [node("b", { bond: 1 }), node("a", { bond: 1 })];
    expect(sortNodes(nodes, "bond", "asc", {}).map((n) => n.node_address)).toEqual(["a", "b"]);
  });

  it("searches node and provider addresses case-insensitively", () => {
    const nodes = [node("thor1abc", { bondProvidersString: "thor1xyz," }), node("thor1def", { bondProvidersString: "" })];
    expect(searchNodes(nodes, " XYZ ").map((n) => n.node_address)).toEqual(["thor1abc"]);
    expect(searchNodes(nodes, "")).toHaveLength(2);
  });

  it("pins favourites to the top keeping order", () => {
    const nodes = [node("a"), node("b"), node("c")];
    expect(pinFavourites(nodes, ["c"]).map((n) => n.node_address)).toEqual(["c", "a", "b"]);
  });
});
