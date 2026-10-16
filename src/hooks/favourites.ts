import { useCallback, useState } from "react";

// Cookie name/format are unchanged from the original dashboard so existing favourites carry over.
const COOKIE = "myFavNodes";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 5;

function readFavourites(): string[] {
  const entry = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!entry) return [];
  try {
    const parsed: unknown = JSON.parse(entry.slice(COOKIE.length + 1));
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeFavourites(list: string[]) {
  const secure = location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${COOKIE}=${JSON.stringify(list)};max-age=${MAX_AGE_SECONDS};path=/;SameSite=Lax${secure}`;
}

export function useFavourites() {
  const [favourites, setFavourites] = useState<string[]>(readFavourites);

  const toggleFavourite = useCallback((address: string) => {
    const current = readFavourites();
    const next = current.includes(address) ? current.filter((a) => a !== address) : [...current, address];
    writeFavourites(next);
    setFavourites(next);
  }, []);

  return { favourites, toggleFavourite };
}
