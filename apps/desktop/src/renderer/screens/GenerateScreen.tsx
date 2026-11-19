import { useCallback, useEffect, useRef, useState } from "react";
import { Player } from "@remotion/player";
import {
  TimelineComposition,
  parseTimeline,
  timelineDuration,
  type TimelineSchema,
} from "@gmotion/ai-director";
import {
  CapcutComposition,
  parseCapcutTimeline,
  type CapcutTimeline,
} from "@gmotion/capcut/render";
import { useTheme } from "../theme";
import { BackIcon, LayersIcon, VideoIcon } from "../components/icons";
import { AgentFeed } from "../components/AgentFeed";
import { CostMeter } from "../components/CostMeter";
import { PREFLIGHT_QUESTIONS } from "../preflight/questions";
import type { AgentEvent, PickedVideo, Project, RenderResult } from "../../shared/types";

interface GenerateScreenProps {
  project: Project;
  onBack: () => void;
}

const TYPE_LABEL: Record<Project["type"], string> = {
  EV: "Edição de vídeo",
  GM: "Graphics Motion",
};

type Phase = "preflight" | "generating" | "preview" | "rendering" | "done";

type PreviewTimeline =
  | { kind: "gm"; timeline: TimelineSchema }
  | { kind: "ev"; timeline: CapcutTimeline };

/** Caminho absoluto → URL servida pelo protocolo gm-media do main. */
const toMediaUrl = (src: string): string =>
  /^([A-Za-z]:[\\/]|\/(?!\/))/.test(src)
    ? `gm-media://local/?p=${encodeURIComponent(src)}`
    : src;

/** Clona a timeline trocando srcs absolutos por URLs gm-media (só no preview). */
const remapForPreview = (p: PreviewTimeline): PreviewTimeline => {
  if (p.kind === "gm") {
    const audio = p.timeline.audio?.map((a) => ({ ...a, src: toMediaUrl(a.src) }));
    return { kind: "gm", timeline: { ...p.timeline, audio } };
  }
  const tracks = p.timeline.tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) =>
      c.kind === "video" || c.kind === "image" || c.kind === "audio"
        ? { ...c, src: toMediaUrl(c.src) }
        : c,
    ),
  }));
  return { kind: "ev", timeline: { ...p.timeline, tracks } };
};

export function GenerateScreen({ project, onBack }: GenerateScreenProps) {
  const { theme } = useTheme();
  const isEV = project.type === "EV";
  const questions = PREFLIGHT_QUESTIONS[project.type];

  const [phase, setPhase] = useState<Phase>("preflight");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [cost, setCost] = useState(0);
  const [preview, setPreview] = useState<PreviewTimeline | null>(null);
  const [refineText, setRefineText] = useState("");
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const loadTimeline = useCallback(async () => {
    const raw = await window.gmotion.readTimeline(project.id);
    if (!raw) return;
    try {
      const isEvTimeline =
        typeof raw === "object" && raw !== null && "tracks" in (raw as object);
      setPreview(
        isEvTimeline
          ? { kind: "ev", timeline: parseCapcutTimeline(raw) }
          : { kind: "gm", timeline: parseTimeline(raw) },
      );
      setPhase("preview");
    } catch (err) {
      setErrorMsg(`Timeline inválida: ${(err as Error).message}`);
    }
  }, [project.id]);

  // Assina o feed de progresso uma vez.
  useEffect(() => {
    const unsub = window.gmotion.onProgress((evt) => {
      setEvents((prev) => [...prev, evt]);
      if (evt.type === "agent" && evt.status === "ok" && typeof evt.costUsd === "number") {
        setCost((c) => c + (evt.costUsd as number));
      }
      if (evt.type === "error") setErrorMsg(evt.message ?? "Erro na geração.");
      if (evt.type === "done") {
        // Render usa o mesmo canal só pra log; só recarrega timeline se estava gerando.
        if (phaseRef.current === "generating") void loadTimeline();
      }
    });
    return unsub;
  }, [loadTimeline]);

  const pickVideo = async () => {
    const v = await window.gmotion.pickVideo();
    if (!v) return;
    if (v.durationSeconds > 60) {
      setVideoError(`Vídeo tem ${v.durationSeconds.toFixed(0)}s — máximo 60s.`);
      setVideo(null);
      return;
    }
    setVideoError(null);
    setVideo(v);
  };

  const canStart = isEV ? !!video : true;

  const startGenerate = async () => {
    setEvents([]);
    setCost(0);
    setErrorMsg(null);
    setPhase("generating");
    await window.gmotion.startGenerate(project.id, {
      answers,
      sourceVideoPath: video?.path,
    });
  };

  const doRefine = async () => {
    const instr = refineText.trim();
    if (!instr) return;
    setRefineText("");
    setEvents([]);
    setErrorMsg(null);
    setPhase("generating");
    await window.gmotion.refineGenerate(project.id, instr);
  };

  const doRender = async () => {
    setEvents([]);
    setErrorMsg(null);
    setPhase("rendering");
    const res = await window.gmotion.startRender(project.id);
    setRenderResult(res);
    setPhase("done");
  };

  const logLines = events
    .filter((e) => e.type === "log" && e.message)
    .map((e) => e.message as string)
    .join("");

  const remapped = preview ? remapForPreview(preview) : null;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "16px 28px",
          borderBottom: `1px solid ${theme.border}`,
          background: theme.surface,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={onBack}
            disabled={phase === "generating" || phase === "rendering"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 14px",
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: theme.surfaceAlt,
              color: theme.text,
              fontWeight: 600,
              opacity: phase === "generating" || phase === "rendering" ? 0.5 : 1,
              cursor:
                phase === "generating" || phase === "rendering"
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            <BackIcon size={18} />
            Voltar
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: theme.accent }}>
              {isEV ? <VideoIcon size={22} /> : <LayersIcon size={22} />}
            </span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{project.name}</div>
              <div style={{ fontSize: 12.5, color: theme.textMuted }}>
                {TYPE_LABEL[project.type]} · {project.type}
              </div>
            </div>
          </div>
        </div>
        <CostMeter costUsd={cost} />
      </header>

      <main style={{ flex: 1, overflowY: "auto", padding: 28 }}>
        {errorMsg && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${theme.danger}`,
              color: theme.danger,
              background: theme.surface,
              fontSize: 13.5,
            }}
          >
            {errorMsg}
          </div>
        )}

        {phase === "preflight" && (
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>
              Vamos planejar seu vídeo
            </h1>
            <p style={{ color: theme.textMuted, margin: "0 0 24px", fontSize: 14.5 }}>
              Responda algumas perguntas. A IA monta o plano e produz o vídeo.
            </p>

            {isEV && (
              <div
                style={{
                  marginBottom: 22,
                  padding: 18,
                  borderRadius: 14,
                  border: `1px dashed ${theme.border}`,
                  background: theme.surface,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 10 }}>
                  Vídeo-fonte (máx. 1 minuto)
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: video ? theme.text : theme.textMuted,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {video
                      ? `${video.path} (${video.durationSeconds.toFixed(0)}s)`
                      : "Nenhum vídeo selecionado"}
                  </span>
                  <button
                    onClick={pickVideo}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: `1px solid ${theme.border}`,
                      background: theme.surfaceAlt,
                      color: theme.text,
                      fontWeight: 600,
                    }}
                  >
                    Escolher vídeo
                  </button>
                </div>
                {videoError && (
                  <div style={{ marginTop: 8, color: theme.danger, fontSize: 12.5 }}>
                    {videoError}
                  </div>
                )}
              </div>
            )}

            {questions.map((q) => (
              <label key={q.id} style={{ display: "block", marginBottom: 16 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{q.label}</span>
                {q.type === "select" ? (
                  <select
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                    }
                    style={inputStyle(theme)}
                  >
                    <option value="">Selecione…</option>
                    {q.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                    }
                    placeholder={q.placeholder}
                    style={inputStyle(theme)}
                  />
                )}
              </label>
            ))}

            <button
              disabled={!canStart}
              onClick={startGenerate}
              style={{
                marginTop: 8,
                padding: "13px 24px",
                borderRadius: 12,
                border: "none",
                background: canStart ? theme.accent : theme.border,
                color: canStart ? theme.accentText : theme.textMuted,
                fontWeight: 800,
                fontSize: 15,
                cursor: canStart ? "pointer" : "not-allowed",
              }}
            >
              Iniciar produção com IA
            </button>
          </div>
        )}

        {(phase === "generating" || phase === "rendering") && (
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
              {phase === "rendering" ? "Exportando vídeo…" : "A IA está produzindo…"}
            </h1>
            <p style={{ color: theme.textMuted, margin: "0 0 22px", fontSize: 14 }}>
              Aguarde — os controles ficam travados até terminar.
            </p>
            {phase === "generating" && <AgentFeed events={events} />}
            {logLines && (
              <pre
                style={{
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  background: theme.surface,
                  color: theme.textMuted,
                  fontSize: 12,
                  maxHeight: 240,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {logLines}
              </pre>
            )}
          </div>
        )}

        {phase === "preview" && remapped && (
          <div
            style={{
              display: "flex",
              gap: 28,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 340 }}>
              {remapped.kind === "gm" ? (
                <Player
                  component={TimelineComposition}
                  inputProps={{ timeline: remapped.timeline }}
                  durationInFrames={Math.max(1, timelineDuration(remapped.timeline))}
                  fps={remapped.timeline.fps}
                  compositionWidth={remapped.timeline.width}
                  compositionHeight={remapped.timeline.height}
                  controls
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: `1px solid ${theme.border}`,
                  }}
                />
              ) : (
                <Player
                  component={CapcutComposition}
                  inputProps={{ timeline: remapped.timeline }}
                  durationInFrames={Math.max(1, remapped.timeline.durationInFrames)}
                  fps={remapped.timeline.fps}
                  compositionWidth={remapped.timeline.width}
                  compositionHeight={remapped.timeline.height}
                  controls
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: `1px solid ${theme.border}`,
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 280, maxWidth: 420 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px" }}>
                Pré-visualização pronta
              </h2>
              <p style={{ color: theme.textMuted, fontSize: 14, margin: "0 0 16px" }}>
                Peça um ajuste à IA ou exporte o vídeo final.
              </p>
              <textarea
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder="Ex.: deixa o fundo mais escuro e o texto maior"
                rows={3}
                style={{ ...inputStyle(theme), resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  onClick={doRefine}
                  disabled={!refineText.trim()}
                  style={{
                    padding: "11px 18px",
                    borderRadius: 10,
                    border: `1px solid ${theme.border}`,
                    background: theme.surfaceAlt,
                    color: theme.text,
                    fontWeight: 700,
                    cursor: refineText.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Pedir mudança
                </button>
                <button
                  onClick={doRender}
                  style={{
                    padding: "11px 22px",
                    borderRadius: 10,
                    border: "none",
                    background: theme.accent,
                    color: theme.accentText,
                    fontWeight: 800,
                  }}
                >
                  Render (exportar)
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div style={{ maxWidth: 560, margin: "40px auto 0", textAlign: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>
              {renderResult?.ok ? "Vídeo exportado! 🎉" : "Falha na exportação"}
            </h1>
            {renderResult?.ok && renderResult.outputDir && (
              <>
                <p style={{ color: theme.textMuted, fontSize: 14 }}>
                  Salvo em: {renderResult.outputDir}
                </p>
                <button
                  onClick={() => window.gmotion.openPath(renderResult.outputDir as string)}
                  style={{
                    marginTop: 12,
                    padding: "11px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: theme.accent,
                    color: theme.accentText,
                    fontWeight: 700,
                  }}
                >
                  Abrir pasta
                </button>
              </>
            )}
            {!renderResult?.ok && (
              <pre
                style={{
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 12,
                  textAlign: "left",
                  border: `1px solid ${theme.border}`,
                  background: theme.surface,
                  color: theme.textMuted,
                  fontSize: 12,
                  maxHeight: 240,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {renderResult?.log}
              </pre>
            )}
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => setPhase("preview")}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: `1px solid ${theme.border}`,
                  background: theme.surfaceAlt,
                  color: theme.text,
                  fontWeight: 600,
                }}
              >
                Voltar à pré-visualização
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function inputStyle(theme: ReturnType<typeof useTheme>["theme"]): React.CSSProperties {
  return {
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
  };
}
