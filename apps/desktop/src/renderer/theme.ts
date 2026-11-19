import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";

export interface ThemeTokens {
  mode: ThemeMode;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentText: string;
  danger: string;
  shadow: string;
}

// Paleta: azul, branco, preto.
const ACCENT = "#2563eb";
const ACCENT_HOVER = "#1d4ed8";

export const lightTheme: ThemeTokens = {
  mode: "light",
  bg: "#f5f7fb",
  surface: "#ffffff",
  surfaceAlt: "#eef2f9",
  border: "#dbe2ee",
  text: "#0b0f19",
  textMuted: "#5b6472",
  accent: ACCENT,
  accentHover: ACCENT_HOVER,
  accentText: "#ffffff",
  danger: "#dc2626",
  shadow: "0 8px 24px rgba(15, 23, 42, 0.10)",
};

export const darkTheme: ThemeTokens = {
  mode: "dark",
  bg: "#0b0f19",
  surface: "#141a26",
  surfaceAlt: "#1c2333",
  border: "#273042",
  text: "#f5f7fb",
  textMuted: "#9aa5b8",
  accent: ACCENT,
  accentHover: "#3b82f6",
  accentText: "#ffffff",
  danger: "#f87171",
  shadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
};

interface ThemeContextValue {
  theme: ThemeTokens;
  mode: ThemeMode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "gmotion.theme";

function initialMode(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "light" || saved === "dark" ? saved : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    document.body.style.background = mode === "dark" ? darkTheme.bg : lightTheme.bg;
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: mode === "dark" ? darkTheme : lightTheme,
      mode,
      toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")),
    }),
    [mode],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
