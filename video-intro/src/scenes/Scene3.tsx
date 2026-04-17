import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Draw circle animation
  const circleProgress = spring({
    frame: frame - 30,
    fps,
    config: {
      damping: 200,
      stiffness: 30,
    },
    durationInFrames: 120, // stretch over 4 seconds
  });

  const strokeDashoffset = interpolate(circleProgress, [0, 1], [1000, 0]);

  // Title drop
  const titleY = spring({
    frame: frame,
    fps,
    config: { damping: 14 }
  });
  const titleYPos = interpolate(titleY, [0, 1], [-50, 0]);
  const titleOpacity = interpolate(titleY, [0, 1], [0, 1]);

  // Benefit pops
  const getPop = (delay: number) => {
    return spring({
      frame: frame - delay,
      fps,
      config: { damping: 10, stiffness: 100 }
    });
  };

  const scale1 = getPop(100);
  const scale2 = getPop(130);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#0f172a', // Dark slate
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h2
        style={{
          color: 'white',
          fontSize: '60px',
          fontWeight: 'bold',
          fontFamily: 'system-ui',
          opacity: titleOpacity,
          transform: `translateY(${titleYPos}px)`,
          position: 'absolute',
          top: '150px',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        Cá nhân hóa <br/>
        <span style={{ color: '#10b981' }}>lộ trình của bạn</span>
      </h2>

      {/* Circle Graph */}
      <div style={{ position: 'relative', marginTop: '-50px', width: '500px', height: '500px' }}>
        <svg viewBox="0 0 400 400" width="500" height="500" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle 
            cx="200" cy="200" r="150" 
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="30" 
          />
          {/* Progress circle */}
          <circle 
            cx="200" cy="200" r="150" 
            fill="none" stroke="url(#gradient)" strokeWidth="30" 
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset={strokeDashoffset}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Text */}
        <div 
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <span style={{ color: 'white', fontSize: '90px', fontWeight: 'bold', fontFamily: 'system-ui' }}>
            {Math.floor(interpolate(circleProgress, [0, 1], [0, 100]))}%
          </span>
          <span style={{ color: '#a1a1aa', fontSize: '30px', fontFamily: 'system-ui' }}>
            Phục hồi
          </span>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '30px', marginTop: '60px' }}>
         <div 
           style={{ 
             background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa',
             padding: '20px 30px', borderRadius: '50px', fontSize: '35px', fontFamily: 'system-ui',
             transform: `scale(${scale1})`,
             opacity: scale1
           }}
          >
            💤 Ngủ ngon hơn
          </div>
          <div 
           style={{ 
             background: 'rgba(16, 185, 129, 0.2)', color: '#34d399',
             padding: '20px 30px', borderRadius: '50px', fontSize: '35px', fontFamily: 'system-ui',
             transform: `scale(${scale2})`,
             opacity: scale2
           }}
          >
            🌿 Thích nghi tốt
          </div>
      </div>
    </div>
  );
};
