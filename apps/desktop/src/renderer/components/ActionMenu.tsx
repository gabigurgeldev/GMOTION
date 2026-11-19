import { useTheme } from "../theme";
import { PlusIcon } from "./icons";

interface ActionMenuProps {
  onCreate: () => void;
}

export function ActionMenu({ onCreate }: ActionMenuProps) {
  const { theme } = useTheme();

  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "18px 20px",
        borderRadius: 16,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
      }}
    >
      <div>
        <div style={{ fontSize: 13, color: theme.textMuted, letterSpacing: 1 }}>
          MENU DE AÇÕES
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>
          Comece um novo vídeo
        </div>
      </div>

      <button
        onClick={onCreate}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 20px",
          borderRadius: 12,
          border: "none",
          background: theme.accent,
          color: theme.accentText,
          fontSize: 15,
          fontWeight: 700,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = theme.accentHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = theme.accent)}
      >
        <PlusIcon size={18} />
        Criar novo projeto
      </button>
    </section>
  );
}
