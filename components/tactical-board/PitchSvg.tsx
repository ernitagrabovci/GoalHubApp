import { memo } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg';

import { Tactical } from '@/constants/tactical-theme';
import { PITCH_H, PITCH_W, viewFor } from '@/lib/tactical/geometry';
import type { PitchMode } from '@/lib/tactical/types';

const STRIPES = 10;
const STRIPE_W = PITCH_W / STRIPES;
const STRIPE_COLORS = [Tactical.stripe1, Tactical.stripe2, Tactical.stripe3, Tactical.stripe2];

/** Penalty arcs: the chord is 5.5m from the spot, the radius is 9.15m. */
const ARC_HALF = Math.sqrt(9.15 ** 2 - 5.5 ** 2); // ≈ 7.31
const ARC_TOP = PITCH_H / 2 - ARC_HALF;
const ARC_BOTTOM = PITCH_H / 2 + ARC_HALF;

const LINE = 0.26;
const BOUNDARY = 0.34;

type Props = {
  mode: PitchMode;
  width: number;
  height: number;
};

function PitchSvgBase({ mode, width, height }: Props) {
  const view = viewFor(mode);

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        <ClipPath id="tactical-pitch-clip">
          <Rect x={0} y={0} width={PITCH_W} height={PITCH_H} />
        </ClipPath>
      </Defs>

      {/* The green board, with its bright frame just inside the view. */}
      <Rect
        x={view.x + 0.1}
        y={view.y + 0.1}
        width={view.w - 0.2}
        height={view.h - 0.2}
        rx={1.1}
        fill={Tactical.stripe2}
      />

      <G clipPath="url(#tactical-pitch-clip)">
        {Array.from({ length: STRIPES }, (_, i) => (
          <Rect
            key={i}
            x={i * STRIPE_W}
            y={0}
            width={STRIPE_W + 0.01}
            height={PITCH_H}
            fill={STRIPE_COLORS[i % STRIPE_COLORS.length]}
          />
        ))}
      </G>

      {/* Boundary and halfway line. */}
      <Rect
        x={0}
        y={0}
        width={PITCH_W}
        height={PITCH_H}
        fill="none"
        stroke={Tactical.pitchLine}
        strokeWidth={BOUNDARY}
      />
      <Line
        x1={PITCH_W / 2}
        y1={0}
        x2={PITCH_W / 2}
        y2={PITCH_H}
        stroke={Tactical.pitchLine}
        strokeWidth={BOUNDARY}
      />

      {/* Centre circle and spot. */}
      <Circle
        cx={PITCH_W / 2}
        cy={PITCH_H / 2}
        r={9.15}
        fill="none"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />
      <Circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={0.34} fill={Tactical.pitchLine} />

      {/* Penalty and goal areas. */}
      <Rect
        x={0}
        y={(PITCH_H - 40.32) / 2}
        width={16.5}
        height={40.32}
        fill="none"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />
      <Rect
        x={PITCH_W - 16.5}
        y={(PITCH_H - 40.32) / 2}
        width={16.5}
        height={40.32}
        fill="none"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />
      <Rect
        x={0}
        y={(PITCH_H - 18.32) / 2}
        width={5.5}
        height={18.32}
        fill="none"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />
      <Rect
        x={PITCH_W - 5.5}
        y={(PITCH_H - 18.32) / 2}
        width={5.5}
        height={18.32}
        fill="none"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />

      {/* Penalty spots and arcs. */}
      <Circle cx={11} cy={PITCH_H / 2} r={0.3} fill={Tactical.pitchLine} />
      <Circle cx={PITCH_W - 11} cy={PITCH_H / 2} r={0.3} fill={Tactical.pitchLine} />
      <Path
        d={`M 16.5 ${ARC_TOP} A 9.15 9.15 0 0 1 16.5 ${ARC_BOTTOM}`}
        fill="none"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />
      <Path
        d={`M ${PITCH_W - 16.5} ${ARC_BOTTOM} A 9.15 9.15 0 0 1 ${PITCH_W - 16.5} ${ARC_TOP}`}
        fill="none"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />

      {/* Corner arcs. */}
      <Path d="M 1 0 A 1 1 0 0 1 0 1" fill="none" stroke={Tactical.pitchLine} strokeWidth={LINE} />
      <Path
        d={`M ${PITCH_W - 1} 0 A 1 1 0 0 0 ${PITCH_W} 1`}
        fill="none"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />
      <Path
        d={`M 0 ${PITCH_H - 1} A 1 1 0 0 1 1 ${PITCH_H}`}
        fill="none"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />
      <Path
        d={`M ${PITCH_W} ${PITCH_H - 1} A 1 1 0 0 0 ${PITCH_W - 1} ${PITCH_H}`}
        fill="none"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />

      {/* Goals, just beyond each goal line. */}
      <Rect
        x={-2.44}
        y={(PITCH_H - 7.32) / 2}
        width={2.44}
        height={7.32}
        fill="rgba(255,255,255,0.12)"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />
      <Rect
        x={PITCH_W}
        y={(PITCH_H - 7.32) / 2}
        width={2.44}
        height={7.32}
        fill="rgba(255,255,255,0.12)"
        stroke={Tactical.pitchLine}
        strokeWidth={LINE}
      />

      {/* Bright-green frame around the whole surface. */}
      <Rect
        x={view.x + 0.35}
        y={view.y + 0.35}
        width={view.w - 0.7}
        height={view.h - 0.7}
        rx={0.9}
        fill="none"
        stroke={Tactical.pitchFrame}
        strokeWidth={0.55}
      />
    </Svg>
  );
}

export const PitchSvg = memo(PitchSvgBase);
