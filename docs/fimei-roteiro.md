# FiMEI — Roteiro de vídeo viral (42s, 9:16)

Estrutura validada: hook 0-3s (regra dos 3 segundos — 71% decidem scroll nessa janela),
agitação, solução em batidas de 1-3s, prova, CTA com urgência.

Narração: tom "papo reto", confiante, energético. Uma frase = uma batida visual = um corte.

---

## BLOCO 1 — HOOK (0:00 - 0:04)

| Tempo | Narração | Visual |
|---|---|---|
| 0:00-0:04 | **"Você é MEI e não sabe se tá no lucro ou no prejuízo?"** | Fundo escuro, texto kinetic gigante palavra por palavra. "LUCRO" em verde, "PREJUÍZO" em vermelho. Bass hit na entrada. Logo FiMEI pequeno canto superior. Zoom punch no final. |

## BLOCO 2 — AGITAÇÃO (0:04 - 0:12)

| Tempo | Narração | Visual |
|---|---|---|
| 0:04-0:07 | "Planilha bagunçada. Conta pessoal misturada com a da empresa." | Card 3D de "planilha" tremendo (shake) com números vermelhos caóticos. Transição: shake-cut. |
| 0:07-0:10 | "E aquele susto no fim do mês, quando o dinheiro simplesmente… sumiu." | Contador despencando de R$ 3.400 para R$ 0 + vinheta fechando. Glitch sutil. |
| 0:10-0:12 | "Sem falar no DAS, que você só lembra quando já venceu." | Badge "DAS VENCIDO" vermelho pulsando + shake forte. Whip pan pra próxima cena. |

## BLOCO 3 — SOLUÇÃO (0:12 - 0:26)

| Tempo | Narração | Visual |
|---|---|---|
| 0:12-0:15 | "Respira. Conhece o FiMEI." | Fundo vira gradiente verde/escuro. Logo FiMEI entra com pop 3D + glow + partículas. Bass hit. |
| 0:15-0:18 | "Lança receita e despesa em segundos." | Card dashboard com contador subindo R$ 0 → R$ 4.750 verde. Tick sound. |
| 0:18-0:21 | "Separa o dinheiro do teu negócio do teu bolso." | Dois cards 3D se separando (pessoal / empresa), slide oposto. Tick. |
| 0:21-0:24 | "Te avisa do DAS antes de vencer. Sempre." | Badge "DAS em dia ✓" verde + sino com pulse. Tick. |
| 0:24-0:26 | "E mostra teu lucro de verdade, na hora." | Barra de progresso enchendo + "LUCRO REAL" kinetic. Tick. |

## BLOCO 4 — PROVA/DIFERENCIAL (0:26 - 0:34)

| Tempo | Narração | Visual |
|---|---|---|
| 0:26-0:30 | "Não é planilha. Não é sistema de empresa grande." | Texto riscando "PLANILHA" e "ERP" com X vermelho, cortes secos. |
| 0:30-0:34 | "É feito pra quem toca o negócio sozinho: você." | Texto "FEITO PRA MEI" gigante + logo flutuando com parallax. Light leak quente. |

## BLOCO 5 — CTA (0:34 - 0:42)

| Tempo | Narração | Visual |
|---|---|---|
| 0:34-0:38 | "Clica no link e organiza teu MEI hoje. Leva dois minutos." | Logo central com glow + badge "COMEÇAR AGORA" com borda animada. Bass hit. Screen shake sutil. |
| 0:38-0:42 | *(sem narração — tela trava)* | Tela final congelada: logo + "Organiza teu MEI hoje" + seta pra cima. Grain + vignette. 4s pra decisão. |

---

## Notas de produção

- **Paleta**: verde esmeralda #10b981 (confiança financeira/lucro), vermelho #ef4444 (dor/prejuízo),
  fundo #0a0f0d escuro, texto branco. (Projeto FiMEI não encontrado no disco — sem tailwind config
  pra verificar; ajustar quando disponível.)
- **Logo**: `apps/studio/public/logo-fimei.png` — placeholder gerado; substituir pelo real.
- **Áudio**: blocos separados em `apps/studio/public/audio/fimei/` (hook.mp3, agitacao.mp3,
  solucao.mp3, prova.mp3, cta.mp3) + sfx. Durações medidas alimentam `fimei-timing.json`.
- **SFX sugeridos** (baixar de freesound/pixabay, colocar em public/audio/fimei/sfx/):
  bass-hit.mp3, whoosh.mp3, tick.mp3, música build-up 45s.
