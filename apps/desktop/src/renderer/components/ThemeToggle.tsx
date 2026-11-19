import { useTheme } from "../theme";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
  const { theme, mode, toggle } = useTheme();
  const dark = mode === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Ativar modo dia" : "Ativar modo noite"}
      title={dark ? "Modo dia" : "Modo noite"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${theme.border}`,
        background: theme.surfaceAlt,
        color: theme.text,
        width: 64,
        justifyContent: dark ? "flex-start" : "flex-end",
        transition: "all 0.2s ease",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          borderRadius: 999,
          background: theme.accent,
          color: theme.accentText,
        }}
      >
        {dark ? <MoonIcon size={14} /> : <SunIcon size={14} />}
      </span>
    </button>
  );
}
