import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Opacity fade in
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Slow scale for dramatic effect
  const scale = interpolate(frame, [0, 150], [1, 1.05], {
    extrapolateRight: 'clamp',
  });

  // Jitter effect for "ringing" (tinnitus)
  // We'll apply it heavily at start, and fade it out
  const jitterIntensity = interpolate(frame, [30, 90], [10, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  
  const jitterX = Math.sin(frame * 2.5) * jitterIntensity;
  const jitterY = Math.cos(frame * 2.1) * jitterIntensity;

  // Background noise effect using CSS gradient
  const bgOpacity = interpolate(frame, [120, 150], [1, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#0a0a0a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
          opacity: bgOpacity,
        }}
      />
      
      <h1
        style={{
          fontSize: '90px',
          fontWeight: 800,
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          opacity,
          transform: `scale(${scale}) translate(${jitterX}px, ${jitterY}px)`,
          maxWidth: '80%',
          lineHeight: 1.2,
          textShadow: '0 0 40px rgba(255,255,255,0.2)',
        }}
      >
        <span style={{ color: '#888' }}>Sống chung với<br/></span>
        <span style={{ color: '#fff' }}>chứng ù tai?</span>
      </h1>
      
      <p
        style={{
          fontSize: '40px',
          color: '#666',
          marginTop: '40px',
          opacity: interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp' }),
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        Bạn không cô đơn.
      </p>
    </div>
  );
};
