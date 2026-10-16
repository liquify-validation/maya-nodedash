import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Theme } from "../types";

// Same storage key as the original dashboard so users keep their choice.
const STORAGE_KEY = "theme";

function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "light", toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    // The stylesheet's [data-theme="dark"] variables are scoped to <body>.
    document.body.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage unavailable (private mode); the theme still applies for this visit.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), []);
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Pick the light or dark variant of an asset. */
export function useThemed() {
  const { theme } = useTheme();
  return useCallback((light: string, dark: string) => (theme === "light" ? light : dark), [theme]);
}
