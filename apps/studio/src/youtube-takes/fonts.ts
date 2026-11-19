import {continueRender, delayRender, staticFile} from 'remotion';

/** Degular (pack EditClass) — carregada uma vez via FontFace, bloqueando o render até pronta. */
const FACES: {family: string; file: string; weight: string; style?: string}[] = [
  {family: 'Degular', file: 'fonts/Degular-Semibold.otf', weight: '600'},
  {family: 'Degular', file: 'fonts/Degular-Medium.otf', weight: '500'},
  {family: 'Degular', file: 'fonts/Degular-Regular.otf', weight: '400'},
  {family: 'Degular', file: 'fonts/Degular-SemiboldItalic.otf', weight: '600', style: 'italic'},
  {family: 'Degular', file: 'fonts/Degular-BoldItalic.otf', weight: '800', style: 'italic'},
  {family: 'Playfair', file: 'fonts/PlayfairDisplay-BoldItalic.ttf', weight: '700', style: 'italic'},
];

let started = false;

export const ensureFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Carregando fontes Degular');
  Promise.all(
    FACES.map((f) => {
      const face = new FontFace(f.family, `url(${staticFile(f.file)})`, {
        weight: f.weight,
        style: f.style ?? 'normal',
      });
      return face.load().then((loaded) => {
        (document.fonts as unknown as {add: (f: FontFace) => void}).add(loaded);
      });
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};

export const ORANGE = '#FF7A33';
export const FONT = 'Degular, Helvetica, Arial, sans-serif';
