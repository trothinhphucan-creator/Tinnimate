import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Sequence } from 'remotion';

const FeatureCard: React.FC<{ title: string; subtitle: string; delay: number; icon: string }> = ({ title, subtitle, delay, icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 12,
      stiffness: 90,
    },
  });

  const translateY = interpolate(progress, [0, 1], [100, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '30px',
        padding: '40px',
        width: '80%',
        marginBottom: '30px',
        transform: `translateY(${translateY}px)`,
        opacity,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ fontSize: '80px', marginRight: '40px' }}>{icon}</div>
      <div>
        <h3 style={{ margin: 0, fontSize: '45px', color: '#fff', fontWeight: 600, fontFamily: 'system-ui' }}>{title}</h3>
        <p style={{ margin: '10px 0 0 0', fontSize: '30px', color: 'rgba(255,255,255,0.8)', fontFamily: 'system-ui' }}>{subtitle}</p>
      </div>
    </div>
  );
};

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgGradient = interpolate(
    Math.min(frame, 60), 
    [0, 60], 
    [0, 1]
  );

  const titleOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const titleY = interpolate(spring({ frame: frame - 30, fps, config: { damping: 12 } }), [0, 1], [50, 0]);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#1e3a8a', // Deep blue tailwind color
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '100px',
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          opacity: bgGradient
        }}
      />
      
      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <h2
          style={{
            fontSize: '70px',
            color: '#fff',
            fontWeight: 'bold',
            fontFamily: 'system-ui',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: '80px',
            textAlign: 'center'
          }}
        >
          Tinnimate<br/>
          <span style={{ fontSize: '50px', color: '#93c5fd' }}>Người bạn đồng hành</span>
        </h2>

        <FeatureCard 
          title="Sound Mixer" 
          subtitle="Tạo luồng âm thanh trị liệu" 
          delay={90} 
          icon="🎧" 
        />
        <FeatureCard 
          title="AI Chat" 
          subtitle="Tư vấn 24/7 chuyên sâu" 
          delay={110} 
          icon="🤖" 
        />
        <FeatureCard 
          title="CBT Therapy" 
          subtitle="Điều chỉnh nhận thức hành vi" 
          delay={130} 
          icon="🧘" 
        />
      </div>
    </div>
  );
};
