import { useEffect, useState } from "react";
import { useTheme } from "../theme";
import type { AiProvider, Settings } from "../../shared/types";

interface SettingsModalProps {
  onClose: () => void;
}

const AI_OPTIONS: { value: AiProvider; title: string; desc: string }[] = [
  {
    value: "openrouter",
    title: "OpenRouter",
    desc: "Chave de API própria da OpenRouter",
  },
  {
    value: "claude-cli",
    title: "Claude Code",
    desc: "Usa a sessão já autenticada no Claude Code instalado",
  },
];

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const [reindexLog, setReindexLog] = useState<string | null>(null);

  useEffect(() => {
    window.gmotion.getSettings().then(setSettings);
  }, []);

  const update = async (partial: Partial<Settings>) => {
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev));
    const next = await window.gmotion.updateSettings(partial);
    setSettings(next);
  };

  const pickFolder = async (kind: "assets" | "renderOutput") => {
    const folder = await window.gmotion.pickFolder(kind);
    if (folder === null) return;
    const next = await window.gmotion.getSettings();
    setSettings(next);
  };

  const reindex = async () => {
    setReindexing(true);
    setReindexLog(null);
    const result = await window.gmotion.reindexAssets();
    setReindexLog(result.log || (result.ok ? "Reindexação concluída." : "Falhou."));
    setReindexing(false);
  };

  if (!settings) return null;

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: theme.text,
    marginBottom: 8,
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const pathBoxStyle: React.CSSProperties = {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: settings ? theme.text : theme.textMuted,
    fontSize: 13,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 16px",
    borderRadius: 10,
    border: `1px solid ${theme.border}`,
    background: theme.surfaceAlt,
    color: theme.text,
    fontWeight: 600,
    whiteSpace: "nowrap",
  };

  const sectionStyle: React.CSSProperties = {
    padding: "18px 0",
    borderTop: `1px solid ${theme.border}`,
  };

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
          maxHeight: "85vh",
          overflowY: "auto",
          borderRadius: 20,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadow,
          padding: 28,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Configurações</h2>
        <p style={{ margin: "6px 0 0", color: theme.textMuted, fontSize: 14 }}>
          Preferências salvas neste computador.
        </p>

        <section style={sectionStyle}>
          <span style={labelStyle}>Pasta de assets do cliente</span>
          <div style={rowStyle}>
            <span style={pathBoxStyle}>
              {settings.assetsFolder ?? "Nenhuma pasta selecionada"}
            </span>
            <button style={buttonStyle} onClick={() => pickFolder("assets")}>
              Escolher pasta
            </button>
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <button
              style={{
                ...buttonStyle,
                opacity: settings.assetsFolder && !reindexing ? 1 : 0.5,
                cursor: settings.assetsFolder && !reindexing ? "pointer" : "not-allowed",
              }}
              disabled={!settings.assetsFolder || reindexing}
              onClick={reindex}
            >
              {reindexing ? "Reindexando…" : "Reindexar agora"}
            </button>
            {reindexLog && (
              <span style={{ fontSize: 12.5, color: theme.textMuted }}>{reindexLog}</span>
            )}
          </div>
        </section>

        <section style={sectionStyle}>
          <span style={labelStyle}>IA do Director</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {AI_OPTIONS.map((opt) => {
              const active = settings.aiProvider === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => update({ aiProvider: opt.value })}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: 14,
                    borderRadius: 14,
                    textAlign: "left",
                    background: active ? theme.surfaceAlt : "transparent",
                    border: `2px solid ${active ? theme.accent : theme.border}`,
                    color: theme.text,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{opt.title}</span>
                  <span style={{ fontSize: 12, color: theme.textMuted }}>{opt.desc}</span>
                </button>
              );
            })}
          </div>

          {settings.aiProvider === "openrouter" && (
            <>
              <label style={{ display: "block", marginTop: 14 }}>
                <span style={{ fontSize: 13, color: theme.textMuted }}>Chave de API</span>
                <input
                  type="password"
                  value={settings.openRouterApiKey ?? ""}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev ? { ...prev, openRouterApiKey: e.target.value } : prev,
                    )
                  }
                  onBlur={(e) => update({ openRouterApiKey: e.target.value || null })}
                  placeholder="sk-or-..."
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
              <label style={{ display: "block", marginTop: 12 }}>
                <span style={{ fontSize: 13, color: theme.textMuted }}>
                  Modelo (id do OpenRouter — em branco usa
                  anthropic/claude-opus-4-8)
                </span>
                <input
                  list="openrouter-models"
                  value={settings.openRouterModel ?? ""}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev ? { ...prev, openRouterModel: e.target.value } : prev,
                    )
                  }
                  onBlur={(e) => update({ openRouterModel: e.target.value || null })}
                  placeholder="anthropic/claude-opus-4-8"
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
                <datalist id="openrouter-models">
                  <option value="anthropic/claude-opus-4-8" />
                  <option value="anthropic/claude-sonnet-5" />
                  <option value="anthropic/claude-haiku-4.5" />
                  <option value="openai/gpt-5.2" />
                  <option value="google/gemini-3-pro" />
                  <option value="deepseek/deepseek-v3.2" />
                </datalist>
              </label>
            </>
          )}

          {settings.aiProvider === "claude-cli" && (
            <label style={{ display: "block", marginTop: 14 }}>
              <span style={{ fontSize: 13, color: theme.textMuted }}>
                Caminho do executável (opcional — deixe em branco pra usar o "claude" do
                PATH)
              </span>
              <input
                value={settings.claudeCliPath ?? ""}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, claudeCliPath: e.target.value } : prev,
                  )
                }
                onBlur={(e) => update({ claudeCliPath: e.target.value || null })}
                placeholder="claude"
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
          )}
        </section>

        <section style={sectionStyle}>
          <span style={labelStyle}>Pasta de saída dos vídeos renderizados</span>
          <div style={rowStyle}>
            <span style={pathBoxStyle}>
              {settings.renderOutputFolder ?? "Padrão (out/ do projeto)"}
            </span>
            <button style={buttonStyle} onClick={() => pickFolder("renderOutput")}>
              Escolher pasta
            </button>
          </div>
        </section>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              padding: "11px 22px",
              borderRadius: 10,
              border: "none",
              background: theme.accent,
              color: theme.accentText,
              fontWeight: 700,
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
