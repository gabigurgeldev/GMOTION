import type { ProjectType } from "../../shared/types";

export interface PreflightQuestion {
  id: string;
  label: string;
  type: "text" | "select";
  placeholder?: string;
  options?: string[];
}

/** Perguntas de pré-produção fixas por tipo. A IA usa as respostas no plano. */
export const PREFLIGHT_QUESTIONS: Record<ProjectType, PreflightQuestion[]> = {
  GM: [
    { id: "tema", label: "Sobre o que é o vídeo?", type: "text", placeholder: "Ex.: lançamento de um app de finanças" },
    { id: "objetivo", label: "Qual o objetivo?", type: "select", options: ["Vender / converter", "Informar / educar", "Engajar / viralizar", "Institucional"] },
    { id: "plataforma", label: "Onde vai postar?", type: "select", options: ["Reels (Instagram)", "Shorts (YouTube)", "TikTok", "Outro"] },
    { id: "tom", label: "Tom / estilo", type: "select", options: ["Energético / viral", "Elegante / premium", "Divertido / casual", "Sério / corporativo"] },
    { id: "cta", label: "Chamada para ação (opcional)", type: "text", placeholder: "Ex.: Baixe agora no link da bio" },
  ],
  EV: [
    { id: "objetivo", label: "Qual o objetivo da edição?", type: "select", options: ["Cortes dinâmicos / retenção", "Destaque de momentos", "Tutorial / explicativo", "Vlog / narrativa"] },
    { id: "tom", label: "Tom / estilo", type: "select", options: ["Energético / viral", "Elegante / premium", "Divertido / casual", "Sério / corporativo"] },
    { id: "plataforma", label: "Onde vai postar?", type: "select", options: ["Reels (Instagram)", "Shorts (YouTube)", "TikTok", "Outro"] },
    { id: "legendas", label: "Quer legendas automáticas?", type: "select", options: ["Sim", "Não"] },
    { id: "cta", label: "Chamada para ação (opcional)", type: "text", placeholder: "Ex.: Segue o perfil pra mais" },
  ],
};
