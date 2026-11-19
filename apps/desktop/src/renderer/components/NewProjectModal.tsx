import { useState } from "react";
import { useTheme } from "../theme";
import { LayersIcon, VideoIcon } from "./icons";
import type { ProjectType } from "../../shared/types";

interface NewProjectModalProps {
  onClose: () => void;
  onConfirm: (input: { name: string; type: ProjectType }) => void;
}

interface TypeOption {
  type: ProjectType;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const OPTIONS: TypeOption[] = [
  {
    type: "EV",
    title: "Edição de vídeo",
    desc: "Já tenho um vídeo pronto pra editar",
    icon: <VideoIcon size={40} />,
  },
  {
    type: "GM",
    title: "Graphics Motion",
    desc: "Criar motion graphics do zero",
    icon: <LayersIcon size={40} />,
  },
];

export function NewProjectModal({ onClose, onConfirm }: NewProjectModalProps) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<ProjectType | null>(null);
  const [name, setName] = useState("");

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3, 7, 18, 0.6)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 20,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadow,
          padding: 28,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          Qual o tipo de vídeo?
        </h2>
        <p style={{ margin: "6px 0 20px", color: theme.textMuted, fontSize: 14 }}>
          Escolha por onde começar. Você pode ajustar depois.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          {OPTIONS.map((opt) => {
            const active = selected === opt.type;
            return (
              <button
                key={opt.type}
                onClick={() => setSelected(opt.type)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 18,
                  borderRadius: 16,
                  textAlign: "left",
                  background: active ? theme.surfaceAlt : "transparent",
                  border: `2px solid ${active ? theme.accent : theme.border}`,
                  color: theme.text,
                  transition: "all 0.12s ease",
                }}
              >
                <span style={{ color: theme.accent }}>{opt.icon}</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{opt.title}</span>
                <span style={{ fontSize: 12.5, color: theme.textMuted }}>
                  {opt.desc}
                </span>
                <span
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 1,
                    color: theme.accent,
                  }}
                >
                  {opt.type}
                </span>
              </button>
            );
          })}
        </div>

        <label
          style={{
            display: "block",
            marginTop: 20,
            fontSize: 13,
            color: theme.textMuted,
          }}
        >
          Nome do projeto (opcional)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Meu vídeo"
            style={{
              display: "block",
              width: "100%",
              marginTop: 6,
              padding: "11px 12px",
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: theme.bg,
              color: theme.text,
              fontSize: 14,
              outline: "none",
            }}
          />
        </label>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "11px 18px",
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: "transparent",
              color: theme.text,
              fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            disabled={!selected}
            onClick={() => selected && onConfirm({ name, type: selected })}
            style={{
              padding: "11px 22px",
              borderRadius: 10,
              border: "none",
              background: selected ? theme.accent : theme.border,
              color: selected ? theme.accentText : theme.textMuted,
              fontWeight: 700,
              cursor: selected ? "pointer" : "not-allowed",
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
