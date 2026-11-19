import { useTheme } from "../theme";

/** Medidor de custo de IA acumulado (USD) em tempo real. */
export function CostMeter({ costUsd }: { costUsd: number }) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
        background: theme.surfaceAlt,
      }}
      title="Custo estimado das chamadas de IA nesta sessão"
    >
      <span style={{ fontSize: 12, color: theme.textMuted }}>Custo IA</span>
      <span style={{ fontSize: 16, fontWeight: 800, color: theme.accent }}>
        ${costUsd.toFixed(4)}
      </span>
    </div>
  );
}
