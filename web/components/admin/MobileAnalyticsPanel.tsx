'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalSessions: number;
  activeUsers24h: number;
  avgDurationSecs: number;
  platforms: Record<string, number>;
  topScreens: { screen: string; count: number }[];
  dailySessions: { date: string; count: number }[];
}

const SCREEN_LABELS: Record<string, string> = {
  player: '🎵 Player',
  dashboard: '🏠 Dashboard',
  chat: '💬 Chat Tinni',
  journal: '📖 Nhật ký',
  sleep: '🌙 Ngủ',
  cbti: '🧠 CBT-i',
  zentones: '🎵 Zentones',
  breathing: '🌬️ Hít thở',
  notch_therapy: '🎚️ Notch',
  profile: '👤 Profile',
  paywall: '💳 Paywall',
  login: '🔐 Login',
};

export default function MobileAnalyticsPanel() {
  const [data, setData]     = useState<AnalyticsData | null>(null);
  const [days, setDays]     = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [days]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/mobile-analytics?days=${days}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  function fmtDuration(secs: number) {
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  }

  const maxDailyCount = Math.max(...(data?.dailySessions.map(d => d.count) ?? [1]));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          📊 Mobile Analytics
        </h3>
        <div className="flex gap-1">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                days === d ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm text-center py-6">Đang tải...</p>
      ) : !data ? (
        <p className="text-slate-600 text-sm text-center py-6">Chưa có dữ liệu (cần chạy SQL migration)</p>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-3 text-center">
              <p className="text-2xl font-bold text-indigo-400">{data.totalSessions}</p>
              <p className="text-xs text-slate-500 mt-1">Sessions ({days}d)</p>
            </div>
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{data.activeUsers24h}</p>
              <p className="text-xs text-slate-500 mt-1">Active (24h)</p>
            </div>
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{fmtDuration(data.avgDurationSecs)}</p>
              <p className="text-xs text-slate-500 mt-1">Avg Session</p>
            </div>
          </div>

          {/* Platform split */}
          <div className="rounded-xl border border-slate-800 p-3 flex gap-6 items-center">
            <p className="text-xs text-slate-500 shrink-0">Platform</p>
            {Object.entries(data.platforms).map(([p, c]) => {
              const total = Object.values(data.platforms).reduce((a, b) => a + b, 0);
              const pct   = total > 0 ? Math.round((c / total) * 100) : 0;
              return (
                <div key={p} className="flex items-center gap-2">
                  <span className="text-sm">{p === 'ios' ? '🍎' : '🤖'}</span>
                  <span className="text-xs text-slate-300 font-semibold capitalize">{p}</span>
                  <span className="text-xs text-slate-500">{pct}% ({c})</span>
                </div>
              );
            })}
          </div>

          {/* Daily bar chart (mini) */}
          {data.dailySessions.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Sessions theo ngày</p>
              <div className="flex items-end gap-1 h-16">
                {data.dailySessions.map(({ date, count }) => (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1 group" title={`${date}: ${count}`}>
                    <div
                      className="w-full bg-indigo-600 rounded-t-sm group-hover:bg-indigo-400 transition-colors"
                      style={{ height: `${Math.max(4, (count / maxDailyCount) * 56)}px` }}
                    />
                    <span className="text-[8px] text-slate-600">{date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top screens */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Màn hình phổ biến</p>
            <div className="space-y-1.5">
              {data.topScreens.map(({ screen, count }, i) => {
                const maxCount = data.topScreens[0]?.count ?? 1;
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={screen} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-4">{i + 1}</span>
                    <span className="text-xs text-slate-300 w-28 truncate">
                      {SCREEN_LABELS[screen] ?? screen}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
