import {useCurrentFrame} from 'remotion';
import {AnimatedLayer} from '@gmotion/presets';
import {strokeDrawOffset} from './calc';

export type CalloutProps = {
  /** Texto do rótulo. */
  label: string;
  /** Ponta da seta (para onde aponta), em px da composição. */
  target: {x: number; y: number};
  /** Origem da seta (onde fica o rótulo), em px. */
  origin: {x: number; y: number};
  /** Frames para desenhar a linha. Default: 18. */
  drawFrames?: number;
  /** Frame em que começa. Default: 0. */
  startFrame?: number;
  color?: string;
  /** Espessura da linha. Default: 6. */
  strokeWidth?: number;
  /** Curvatura da linha (0 = reta). Default: 0.25. */
  curvature?: number;
  fontSize?: number;
};

/**
 * Callout: linha curva desenhando da origem até o alvo + ponta de seta +
 * rótulo com pop-in. Coordenadas absolutas da composição.
 *
 * @example
 * <Callout
 *   label="Olha isso!"
 *   origin={{x: 200, y: 500}}
 *   target={{x: 540, y: 900}}
 *   color="#facc15"
 * />
 */
export const Callout = ({
  label,
  target,
  origin,
  drawFrames = 18,
  startFrame = 0,
  color = '#facc15',
  strokeWidth = 6,
  curvature = 0.25,
  fontSize = 42,
}: CalloutProps) => {
  const frame = useCurrentFrame();

  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dist = Math.hypot(dx, dy);

  // Controle perpendicular ao vetor origem->alvo, no ponto médio
  const mx = (origin.x + target.x) / 2 - dy * curvature;
  const my = (origin.y + target.y) / 2 + dx * curvature;
  const path = `M ${origin.x} ${origin.y} Q ${mx} ${my} ${target.x} ${target.y}`;

  // Comprimento aproximado (corda + folga da curva). Determinístico.
  const pathLength = dist * (1 + Math.abs(curvature) * 0.6);
  const dashOffset = strokeDrawOffset({
    frame,
    durationInFrames: drawFrames,
    pathLength,
    startFrame,
  });

  // Ângulo da ponta: tangente no fim da quadrática = controle -> alvo
  const angle = (Math.atan2(target.y - my, target.x - mx) * 180) / Math.PI;
  const drawn = dashOffset <= pathLength * 0.02;

  return (
    <svg
      width="100%"
      height="100%"
      style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
      />
      {drawn ? (
        <g transform={`translate(${target.x}, ${target.y}) rotate(${angle})`}>
          <path
            d={`M 0 0 L ${-strokeWidth * 3.2} ${-strokeWidth * 1.8} L ${-strokeWidth * 3.2} ${strokeWidth * 1.8} Z`}
            fill={color}
          />
        </g>
      ) : null}
      <foreignObject
        x={origin.x - 300}
        y={origin.y - 110}
        width={600}
        height={100}
        style={{overflow: 'visible'}}
      >
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <AnimatedLayer enter="pop-in" enterFrames={12}>
            <span
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize,
                fontWeight: 800,
                color: '#0b0b14',
                background: color,
                padding: '12px 28px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </AnimatedLayer>
        </div>
      </foreignObject>
    </svg>
  );
};
