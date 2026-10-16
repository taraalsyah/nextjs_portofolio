import React from 'react';
import { FlowShapeType, StrokeStyle } from '@/types/flow';

interface ShapeRendererProps {
  shapeType: FlowShapeType;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  opacity?: number;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  shapeType,
  width,
  height,
  fill = '#ffffff',
  stroke = '#2563eb',
  strokeWidth = 2,
  strokeStyle = 'solid',
  opacity = 1,
}) => {
  const w = Math.max(20, width);
  const h = Math.max(20, height);
  const pad = strokeWidth / 2;

  let strokeDasharray: string | undefined;
  if (strokeStyle === 'dashed') strokeDasharray = '6 4';
  if (strokeStyle === 'dotted') strokeDasharray = '2 3';

  const commonProps = {
    fill,
    stroke,
    strokeWidth,
    strokeDasharray,
    opacity,
    vectorEffect: 'non-scaling-stroke' as const,
  };

  switch (shapeType) {
    case 'startEnd':
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <rect x={pad} y={pad} width={w - strokeWidth} height={h - strokeWidth} rx={(h - strokeWidth) / 2} ry={(h - strokeWidth) / 2} {...commonProps} />
        </svg>
      );

    case 'decision':
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <polygon points={`${w / 2},${pad} ${w - pad},${h / 2} ${w / 2},${h - pad} ${pad},${h / 2}`} {...commonProps} />
        </svg>
      );

    case 'inputOutput': {
      const slant = Math.min(24, w * 0.15);
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <polygon points={`${slant + pad},${pad} ${w - pad},${pad} ${w - slant - pad},${h - pad} ${pad},${h - pad}`} {...commonProps} />
        </svg>
      );
    }

    case 'document': {
      const waveH = Math.min(16, h * 0.2);
      const bottomY = h - pad - waveH;
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <path
            d={`M ${pad} ${pad} L ${w - pad} ${pad} L ${w - pad} ${bottomY} Q ${w * 0.75} ${h + waveH * 0.2} ${w * 0.5} ${bottomY} Q ${w * 0.25} ${bottomY - waveH} ${pad} ${bottomY} Z`}
            {...commonProps}
          />
        </svg>
      );
    }

    case 'database':
    case 'cylinder': {
      const ry = Math.min(14, h * 0.2);
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <path
            d={`M ${pad} ${ry + pad} A ${w / 2 - pad} ${ry} 0 0 1 ${w - pad} ${ry + pad} L ${w - pad} ${h - ry - pad} A ${w / 2 - pad} ${ry} 0 0 1 ${pad} ${h - ry - pad} Z`}
            {...commonProps}
          />
          <ellipse cx={w / 2} cy={ry + pad} rx={w / 2 - pad} ry={ry} {...commonProps} />
        </svg>
      );
    }

    case 'manualInput': {
      const topSlant = Math.min(20, h * 0.3);
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <polygon points={`${pad},${topSlant + pad} ${w - pad},${pad} ${w - pad},${h - pad} ${pad},${h - pad}`} {...commonProps} />
        </svg>
      );
    }

    case 'predefinedProcess': {
      const subOffset = Math.min(16, w * 0.12);
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <rect x={pad} y={pad} width={w - strokeWidth} height={h - strokeWidth} rx={2} ry={2} {...commonProps} />
          <line x1={subOffset} y1={pad} x2={subOffset} y2={h - pad} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
          <line x1={w - subOffset} y1={pad} x2={w - subOffset} y2={h - pad} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />
        </svg>
      );
    }

    case 'connector':
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2 - pad} {...commonProps} />
        </svg>
      );

    case 'delay': {
      const arcR = h / 2 - pad;
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <path
            d={`M ${pad} ${pad} L ${w - arcR - pad} ${pad} A ${arcR} ${arcR} 0 0 1 ${w - arcR - pad} ${h - pad} L ${pad} ${h - pad} Z`}
            {...commonProps}
          />
        </svg>
      );
    }

    case 'ellipse':
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - pad} ry={h / 2 - pad} {...commonProps} />
        </svg>
      );

    case 'triangle':
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <polygon points={`${w / 2},${pad} ${w - pad},${h - pad} ${pad},${h - pad}`} {...commonProps} />
        </svg>
      );

    case 'hexagon': {
      const hexOffset = Math.min(20, w * 0.18);
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <polygon
            points={`${hexOffset},${pad} ${w - hexOffset},${pad} ${w - pad},${h / 2} ${w - hexOffset},${h - pad} ${hexOffset},${h - pad} ${pad},${h / 2}`}
            {...commonProps}
          />
        </svg>
      );
    }

    case 'roundedRectangle':
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <rect x={pad} y={pad} width={w - strokeWidth} height={h - strokeWidth} rx={12} ry={12} {...commonProps} />
        </svg>
      );

    case 'cloud':
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <path
            d={`M ${w * 0.2} ${h * 0.7} A ${w * 0.15} ${h * 0.25} 0 0 1 ${w * 0.3} ${h * 0.35} A ${w * 0.25} ${h * 0.3} 0 0 1 ${w * 0.7} ${h * 0.3} A ${w * 0.18} ${h * 0.25} 0 0 1 ${w * 0.85} ${h * 0.65} A ${w * 0.15} ${h * 0.2} 0 0 1 ${w * 0.7} ${h * 0.85} L ${w * 0.3} ${h * 0.85} A ${w * 0.15} ${h * 0.2} 0 0 1 ${w * 0.2} ${h * 0.7} Z`}
            {...commonProps}
          />
        </svg>
      );

    case 'callout': {
      const tailW = 16;
      const tailH = 12;
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <path
            d={`M ${pad + 6} ${pad} L ${w - pad - 6} ${pad} Q ${w - pad} ${pad} ${w - pad} ${pad + 6} L ${w - pad} ${h - tailH - pad - 6} Q ${w - pad} ${h - tailH - pad} ${w - pad - 6} ${h - tailH - pad} L ${w * 0.4} ${h - tailH - pad} L ${w * 0.25} ${h - pad} L ${w * 0.3} ${h - tailH - pad} L ${pad + 6} ${h - tailH - pad} Q ${pad} ${h - tailH - pad} ${pad} ${h - tailH - pad - 6} L ${pad} ${pad + 6} Q ${pad} ${pad} ${pad + 6} ${pad} Z`}
            {...commonProps}
          />
        </svg>
      );
    }

    case 'process':
    case 'rectangle':
    default:
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <rect x={pad} y={pad} width={w - strokeWidth} height={h - strokeWidth} rx={2} ry={2} {...commonProps} />
        </svg>
      );
  }
};
