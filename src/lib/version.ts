/**
 * Compare two node versions ("3.20.3", "3.21.0-rc1"). Numeric parts are compared
 * numerically; a pre-release sorts below its release. Returns <0, 0 or >0.
 */
export function compareVersions(a: string, b: string): number {
  const [coreA, preA = ""] = (a ?? "").split("-", 2);
  const [coreB, preB = ""] = (b ?? "").split("-", 2);
  const partsA = coreA.split(".").map((n) => parseInt(n, 10) || 0);
  const partsB = coreB.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  if (preA === preB) return 0;
  if (!preA) return 1;
  if (!preB) return -1;
  return preA.localeCompare(preB);
}

export function maxVersion(versions: string[]): string {
  return versions.reduce((max, v) => (compareVersions(v, max) > 0 ? v : max), versions[0] ?? "");
}
