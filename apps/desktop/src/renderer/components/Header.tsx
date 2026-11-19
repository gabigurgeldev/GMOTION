import { useTheme } from "../theme";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsIcon, UserIcon } from "./icons";

interface HeaderProps {
  onProfile?: () => void;
  onSettings?: () => void;
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
        background: theme.surfaceAlt,
        color: theme.text,
      }}
    >
      {children}
    </button>
  );
}

export function Header({ onProfile, onSettings }: HeaderProps) {
  const { theme } = useTheme();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 28px",
        borderBottom: `1px solid ${theme.border}`,
        background: theme.surface,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            width: 34,
            height: 34,
            borderRadius: 9,
            background: theme.accent,
            color: theme.accentText,
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 18,
          }}
        >
          G
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          GMOTION
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ThemeToggle />
        <IconButton label="Perfil" onClick={onProfile}>
          <UserIcon />
        </IconButton>
        <IconButton label="Configurações" onClick={onSettings}>
          <SettingsIcon />
        </IconButton>
      </div>
    </header>
  );
}
