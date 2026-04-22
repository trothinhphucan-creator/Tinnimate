import React from 'react';
import Svg, { Path, Ellipse } from 'react-native-svg';
import { V } from '@/constants/theme';

interface LeafProps { size?: number; color?: string; rotate?: number }

export function Leaf({ size = 24, color = V.sage, rotate = 0 }: LeafProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      <Path
        d="M12 22 C 12 16, 6 12, 6 6 C 6 4, 8 3, 10 3 C 14 3, 18 8, 18 14 C 18 18, 15 21, 12 22 Z"
        fill={color} opacity={0.85}
      />
      <Path d="M12 22 C 11 18, 10 13, 9 7" stroke={color} strokeWidth={0.8} fill="none" opacity={0.6}/>
    </Svg>
  );
}

export function LeafOutline({ size = 24, color = V.sage, rotate = 0 }: LeafProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      <Path
        d="M12 22 C 12 16, 6 12, 6 6 C 6 4, 8 3, 10 3 C 14 3, 18 8, 18 14 C 18 18, 15 21, 12 22 Z"
        fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round"
      />
      <Path d="M12 22 C 11 18, 10 13, 9 7" stroke={color} strokeWidth={1} fill="none"/>
    </Svg>
  );
}

interface SprigProps { size?: number; color?: string }

export function Sprig({ size = 40, color = V.sage }: SprigProps) {
  const w = size * 2;
  return (
    <Svg width={w} height={size} viewBox="0 0 80 40">
      <Path d="M40 38 C 30 36, 20 30, 12 18 M12 18 C 8 14, 8 10, 10 8 C 14 6, 20 10, 22 16"
        stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round"/>
      <Ellipse cx={16} cy={13} rx={5} ry={3} fill={color} opacity={0.7} transform="rotate(-35 16 13)"/>
      <Ellipse cx={24} cy={22} rx={5} ry={3} fill={color} opacity={0.7} transform="rotate(-20 24 22)"/>
      <Path d="M40 38 C 50 36, 60 30, 68 18 M68 18 C 72 14, 72 10, 70 8 C 66 6, 60 10, 58 16"
        stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round"/>
      <Ellipse cx={64} cy={13} rx={5} ry={3} fill={color} opacity={0.7} transform="rotate(35 64 13)"/>
      <Ellipse cx={56} cy={22} rx={5} ry={3} fill={color} opacity={0.7} transform="rotate(20 56 22)"/>
    </Svg>
  );
}

interface VineProps { width?: number; color?: string; opacity?: number }

export function Vine({ width = 120, color = V.sageDeep, opacity = 0.5 }: VineProps) {
  const h = width * 0.6;
  const leafData: [number, number, number][] = [
    [20, 60, -40], [40, 50, -30], [58, 38, -15], [76, 24, 10], [92, 14, 25],
  ];
  return (
    <Svg width={width} height={h} viewBox="0 0 120 72" style={{ opacity }}>
      <Path d="M2 70 C 30 60, 50 50, 70 30 C 85 14, 100 8, 118 2"
        stroke={color} strokeWidth={1.2} fill="none" strokeLinecap="round"/>
      {leafData.map(([x, y, r], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={5} ry={2.5} fill={color} opacity={0.8}
          transform={`rotate(${r} ${x} ${y})`}/>
      ))}
    </Svg>
  );
}
