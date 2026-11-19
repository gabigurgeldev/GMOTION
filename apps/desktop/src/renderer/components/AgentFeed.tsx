import { useEffect, useState } from "react";
import { useTheme } from "../theme";
import type { AgentName, AgentEvent } from "../../shared/types";

const AGENT_ORDER: AgentName[] = [
  "roteiro",
  "estrutura",
  "texto",
  "cor",
  "audio",
  "orquestrador",
];

const AGENT_LABELS: Record<AgentName, string> = {
  roteiro: "Roteiro",
  estrutura: "Corte / Edição",
  texto: "Textos e animação",
  cor: "Cor e filtros",
  audio: "Áudio (narração/SFX)",
  orquestrador: "Orquestrador",
};

type AgentStatus = "pending" | "start" | "ok" | "error";

interface AgentState {
  status: AgentStatus;
  message?: string;
  phase?: string;
  startedAt?: number;
}

/** Feed ao vivo dos 6 agentes com status + fase atual + o que cada um fez. */
export function AgentFeed({ events }: { events: AgentEvent[] }) {
  const { theme } = useTheme();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Último status + fase + mensagem por agente.
  const state = new Map<AgentName, AgentState>();
  for (const a of AGENT_ORDER) state.set(a, { status: "pending" });
  for (const e of events) {
    if (e.type === "agent" && e.agent) {
      const prev = state.get(e.agent);
      state.set(e.agent, {
        status: (e.status ?? "start") as AgentStatus,
        message: e.message ?? prev?.message,
        phase: e.status === "start" ? e.phase : undefined,
        startedAt: prev?.startedAt ?? (e.status === "start" ? e.ts : undefined),
      });
    }
  }

  const dot = (status: AgentStatus): string => {
    if (status === "ok") return theme.accent;
    if (status === "error") return theme.danger;
    if (status === "start") return "#eab308";
    return theme.border;
  };

  const label = (s: AgentState): string => {
    if (s.status === "ok") return "✓ pronto";
    if (s.status === "error") return "erro";
    if (s.status === "start") return s.phase ?? "Iniciando…";
    return "aguardando";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {AGENT_ORDER.map((a) => {
        const s = state.get(a)!;
        return (
          <div
            key={a}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              opacity: s.status === "pending" ? 0.55 : 1,
            }}
          >
            <span
              className={s.status === "start" ? "gmotion-pulse-dot" : undefined}
              style={{
                marginTop: 4,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: dot(s.status),
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{AGENT_LABELS[a]}</span>
                <span style={{ fontSize: 12, color: theme.textMuted }}>
                  {label(s)}
                  {s.status === "start" && s.startedAt && (
                    <span style={{ marginLeft: 6, color: theme.textMuted }}>
                      {Math.max(0, Math.floor((now - s.startedAt) / 1000))}s
                    </span>
                  )}
                </span>
              </div>
              {s.message && (
                <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 3 }}>
                  {s.message}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
