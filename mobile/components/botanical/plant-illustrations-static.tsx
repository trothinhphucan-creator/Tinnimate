import React from 'react';
import Svg, {
  Circle, Ellipse, Path, Line, Rect, G,
} from 'react-native-svg';
import { V } from '@/constants/theme';

interface PlantProps { size?: number }

export function Fern({ size = 48 }: PlantProps) {
  const h = size * 1.4;
  return (
    <Svg width={size} height={h} viewBox="0 0 48 68">
      <Path d="M24 66 L24 6" stroke={V.sage} strokeWidth={1.4} />
      {Array.from({ length: 9 }, (_, i) => {
        const y = 10 + i * 6;
        const w = 4 + (8 - i * 0.8);
        return (
          <G key={i}>
            <Ellipse cx={24 - w} cy={y} rx={w} ry={2.4} fill={V.sage} opacity={0.8}
              rotation={-20} originX={24 - w} originY={y} />
            <Ellipse cx={24 + w} cy={y} rx={w} ry={2.4} fill={V.sage} opacity={0.8}
              rotation={20} originX={24 + w} originY={y} />
          </G>
        );
      })}
      <Circle cx={24} cy={6} r={2} fill={V.sage} />
    </Svg>
  );
}

export function WaterLily({ size = 48 }: PlantProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Ellipse cx={24} cy={32} rx={20} ry={4} fill={V.sky} opacity={0.3} />
      <Path d="M10 28 A14 14 0 0 1 38 28 L24 28 Z" fill={V.sageDeep} opacity={0.85} />
      <Path d="M13 28 L24 28" stroke={V.bg} strokeWidth={0.6} opacity={0.4} />
      {[-60, -30, 0, 30, 60].map((a, i) => (
        <Ellipse key={i} cx={24} cy={20} rx={3} ry={8} fill={V.petal} opacity={0.9}
          rotation={a} originX={24} originY={24} />
      ))}
      <Circle cx={24} cy={23} r={2.5} fill={V.honey} />
    </Svg>
  );
}

export function Sakura({ size = 48 }: PlantProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {[0, 72, 144, 216, 288].map((a, i) => (
        <Path key={i}
          d="M24 24 C 22 16, 18 10, 24 8 C 30 10, 26 16, 24 24 Z"
          fill={V.petal} opacity={0.92}
          rotation={a} originX={24} originY={24} />
      ))}
      <Circle cx={24} cy={24} r={3} fill={V.honey} />
    </Svg>
  );
}

export function Coral({ size = 48 }: PlantProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M12 44 C 14 32, 10 22, 14 12 M14 12 C 16 16, 18 16, 18 20 M14 12 C 12 16, 10 16, 10 20"
        stroke={V.sky} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M28 44 C 28 32, 34 24, 30 14 M30 14 C 32 18, 34 18, 36 22 M30 14 C 28 18, 26 18, 24 22"
        stroke={V.lavender} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Circle cx={40} cy={30} r={1.5} fill={V.sky} opacity={0.6} />
      <Circle cx={6} cy={26} r={1} fill={V.lavender} opacity={0.6} />
    </Svg>
  );
}

export function Wildflower({ size = 48 }: PlantProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M24 44 L24 22" stroke={V.sageDeep} strokeWidth={1.4} />
      <Ellipse cx={20} cy={32} rx={4} ry={2} fill={V.sage} opacity={0.8}
        rotation={-30} originX={20} originY={32} />
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <Ellipse key={i} cx={24} cy={16} rx={3} ry={6} fill={V.terracotta} opacity={0.9}
          rotation={a} originX={24} originY={22} />
      ))}
      <Circle cx={24} cy={22} r={2.5} fill={V.honey} />
    </Svg>
  );
}

export function Bamboo({ size = 48 }: PlantProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x={21} y={4} width={6} height={40} rx={2} fill={V.sageDeep} />
      <Line x1={21} y1={14} x2={27} y2={14} stroke={V.bg} strokeWidth={1.2} />
      <Line x1={21} y1={26} x2={27} y2={26} stroke={V.bg} strokeWidth={1.2} />
      <Line x1={21} y1={38} x2={27} y2={38} stroke={V.bg} strokeWidth={1.2} />
      <Ellipse cx={14} cy={10} rx={6} ry={2} fill={V.sage} opacity={0.85}
        rotation={-25} originX={14} originY={10} />
      <Ellipse cx={34} cy={20} rx={6} ry={2} fill={V.sage} opacity={0.85}
        rotation={25} originX={34} originY={20} />
    </Svg>
  );
}

export function Mushroom({ size = 48 }: PlantProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Ellipse cx={24} cy={42} rx={16} ry={2} fill={V.sageDeep} opacity={0.4} />
      <Rect x={20} y={24} width={8} height={16} rx={2} fill={V.cream} />
      <Path d="M8 26 A 16 14 0 0 1 40 26 L8 26 Z" fill={V.terracottaD} />
      <Circle cx={16} cy={20} r={2} fill={V.cream} opacity={0.9} />
      <Circle cx={28} cy={16} r={1.5} fill={V.cream} opacity={0.9} />
      <Circle cx={33} cy={22} r={1.8} fill={V.cream} opacity={0.9} />
    </Svg>
  );
}

export function Moonflower({ size = 80 }: PlantProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Circle cx={40} cy={40} r={30} fill={V.lavender} opacity={0.15} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
        <Ellipse key={i} cx={40} cy={22} rx={8} ry={16} fill={V.cream} opacity={0.85}
          rotation={a} originX={40} originY={40} />
      ))}
      <Circle cx={40} cy={40} r={6} fill={V.honey} opacity={0.8} />
      <Circle cx={40} cy={40} r={14} fill="none" stroke={V.lavender} strokeWidth={0.5} opacity={0.5} />
    </Svg>
  );
}

export function Dandelion({ size = 60 }: PlantProps) {
  return (
    <Svg width={size} height={size} viewBox="-60 -60 120 120">
      <Circle r={8} fill={V.honey} opacity={0.6} />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * 360;
        return (
          <G key={i} rotation={a} originX={0} originY={0}>
            <Line x1={0} y1={0} x2={0} y2={-42} stroke={V.cream} strokeWidth={0.6} opacity={0.5} />
            <Circle cx={0} cy={-44} r={2} fill={V.cream} opacity={0.85} />
          </G>
        );
      })}
    </Svg>
  );
}
