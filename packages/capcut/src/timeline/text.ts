import {capColorToHex, cssToCapColor} from '../convert/units';
import type {TextContent} from '../draft/types';

/** Parse do `content` (string JSON) de um material de texto do CapCut. */
export const parseTextContent = (content: string): TextContent => {
  try {
    const parsed = JSON.parse(content) as TextContent;
    return {text: parsed.text ?? '', styles: parsed.styles ?? []};
  } catch {
    // Alguns materiais antigos guardam texto puro.
    return {text: content, styles: []};
  }
};

/** Cor CSS do primeiro estilo (default branco). */
export const capcutColorFromContent = (parsed: TextContent): string => {
  const solid = parsed.styles[0]?.fill?.content?.solid?.color;
  return solid ? capColorToHex(solid) : '#ffffff';
};

/** Monta a string `content` do CapCut a partir de texto + cor + tamanho. */
export const buildTextContent = (
  text: string,
  color: string,
  size: number,
  fontPath?: string | null,
): string => {
  const rgb = cssToCapColor(color);
  const content: TextContent = {
    text,
    styles: [
      {
        fill: {content: {render_type: 'solid', solid: {color: rgb}}},
        font: {path: fontPath ?? '', id: ''},
        size,
        range: [0, text.length],
      },
    ],
  };
  return JSON.stringify(content);
};
