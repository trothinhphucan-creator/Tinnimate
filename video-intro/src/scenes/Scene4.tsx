import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoDrop = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 }
  });

  const logoY = interpolate(logoDrop, [0, 1], [-100, 0]);
  const logoOpacity = interpolate(logoDrop, [0, 1], [0, 1]);

  const ctaScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12 }
  });

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#020617', // Very dark blue/black
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div 
        style={{
          width: '250px',
          height: '250px',
          borderRadius: '50px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 50px rgba(16, 185, 129, 0.3)',
          transform: `translateY(${logoY}px) scale(${interpolate(logoDrop, [0,1], [0.8, 1])})`,
          opacity: logoOpacity,
          marginBottom: '60px'
        }}
      >
        <span style={{ fontSize: '100px' }}>🎧</span>
      </div>

      <h1
        style={{
          color: 'white',
          fontSize: '90px',
          fontWeight: 'bold',
          fontFamily: 'system-ui',
          transform: `translateY(${logoY}px)`,
          opacity: logoOpacity,
          marginBottom: '20px',
        }}
      >
        Tinnimate
      </h1>
      
      <p
        style={{
          color: '#cbd5e1',
          fontSize: '45px',
          fontFamily: 'system-ui',
          transform: `translateY(${logoY}px)`,
          opacity: logoOpacity,
          marginBottom: '80px',
        }}
      >
        Tìm lại sự tĩnh lặng
      </p>

      <div
        style={{
          background: 'white',
          color: '#0f172a',
          padding: '30px 80px',
          borderRadius: '100px',
          fontSize: '45px',
          fontWeight: 'bold',
          fontFamily: 'system-ui',
          transform: `scale(${ctaScale})`,
          opacity: ctaScale,
          boxShadow: '0 10px 30px rgba(255,255,255,0.2)'
        }}
      >
        Tải ngay hôm nay
      </div>
    </div>
  );
};
