/**
 * Agente 5 — Textos e animação de texto. Recebe a timeline atual e devolve a
 * timeline com as layers de texto refinadas: copy, hierarquia, presets de
 * entrada/ênfase, typewriter/lower-third onde couber. NÃO mexe em estrutura/cor.
 */
import {catalogAsText} from '../catalog';
import {callTimelineAgent, planText} from './shared';
import type {CallConfig, OnPhase, Plan, TimelineSchema, TimelineStep} from './types';

export const SYSTEM_TEXTO = `Você é o designer de tipografia/animação de texto de uma equipe de motion graphics. Recebe uma timeline Remotion pronta e MELHORA apenas as camadas de texto.

Blocos disponíveis (use só estes nomes):
${catalogAsText()}

Regras:
- Toda layer de texto visível deve ter um enter preset. Hook grande: zoom-in-bounce ou pop-in. Info sutil: fade-in ou slide-in.
- Use typewriter para punchlines, lower-third para nomes/créditos, badge para CTAs.
- Posições em porcentagem, texto entre 10-90% na horizontal. Não altere durações de cena, backgrounds, transições nem effects globais.
- Mantenha o MESMO número de cenas e a MESMA ordem.
Responda SOMENTE com o JSON completo da timeline.`;

export async function runTexto(
  current: TimelineSchema,
  plan: Plan,
  cfg: CallConfig,
  onPhase?: OnPhase,
): Promise<TimelineStep> {
  onPhase?.('Consultando IA (textos)…');
  const {timeline, costUsd} = await callTimelineAgent(
    cfg,
    SYSTEM_TEXTO,
    `Plano:\n${planText(plan)}\n\nTimeline atual:\n${JSON.stringify(
      current,
    )}\n\nRefine as camadas de texto.`,
  );
  return {timeline, costUsd, summary: 'Textos e presets de animação aplicados'};
}
