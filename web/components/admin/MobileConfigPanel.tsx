'use client';

import { useState, useEffect } from 'react';

interface ConfigRow {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

export default function MobileConfigPanel() {
  const [rows, setRows]   = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState<string | null>(null);
  const [msg, setMsg]         = useState<{ key: string; ok: boolean; text: string } | null>(null);

  useEffect(() => { fetchConfig(); }, []);

  async function fetchConfig() {
    setLoading(true);
    const res = await fetch('/api/admin/mobile-config');
    if (res.ok) {
      const data: ConfigRow[] = await res.json();
      setRows(data);
      const initial: Record<string, string> = {};
      data.forEach(r => { initial[r.key] = JSON.stringify(r.value, null, 2); });
      setEditing(initial);
    }
    setLoading(false);
  }

  async function saveKey(key: string) {
    setSaving(key);
    try {
      const value = JSON.parse(editing[key]);
      const res = await fetch('/api/admin/mobile-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      setMsg({ key, ok: res.ok, text: res.ok ? '✅ Đã lưu' : '❌ Lỗi lưu' });
    } catch {
      setMsg({ key, ok: false, text: '❌ JSON không hợp lệ' });
    }
    setSaving(null);
    setTimeout(() => setMsg(null), 3000);
  }

  if (loading) return <p className="text-slate-400 text-sm p-4">Đang tải mobile config...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          📱 Mobile Remote Config
        </h3>
        <button
          onClick={fetchConfig}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          ↻ Refresh
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Thay đổi config sẽ có hiệu lực trên mobile sau tối đa <strong>5 phút</strong> (TTL cache).
        Không cần release app mới.
      </p>

      {rows.map(row => (
        <div key={row.key} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-mono text-sm font-bold text-indigo-400">{row.key}</span>
              {row.description && (
                <p className="text-xs text-slate-500 mt-0.5">{row.description}</p>
              )}
            </div>
            <span className="text-xs text-slate-600 shrink-0">
              {new Date(row.updated_at).toLocaleString('vi-VN')}
            </span>
          </div>

          {/* JSON editor */}
          <textarea
            className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300
                       focus:border-indigo-500 focus:outline-none resize-none"
            rows={Object.keys(editing[row.key] ? JSON.parse(editing[row.key]) : {}).length + 3}
            value={editing[row.key] ?? ''}
            onChange={e => setEditing(prev => ({ ...prev, [row.key]: e.target.value }))}
          />

          {/* Save + message */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => saveKey(row.key)}
              disabled={saving === row.key}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500
                         text-white disabled:opacity-50 transition-colors">
              {saving === row.key ? 'Đang lưu...' : 'Lưu'}
            </button>
            {msg?.key === row.key && (
              <span className={`text-xs font-medium ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {msg.text}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
