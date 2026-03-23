'use client';

import { useState, useEffect } from 'react';

interface NotifLog {
  id: string;
  title: string;
  body: string;
  target: string;
  sent_at: string;
  sent_count: number;
}

export default function NotificationPanel() {
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [target, setTarget]   = useState('all');
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState<{ ok: boolean; text: string } | null>(null);
  const [logs, setLogs]       = useState<NotifLog[]>([]);

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    const res = await fetch('/api/admin/notifications');
    if (res.ok) setLogs(await res.json());
  }

  async function send() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, target: target || 'all' }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, text: `✅ Đã gửi đến ${data.sent} thiết bị` });
        setTitle(''); setBody(''); setTarget('all');
        fetchLogs();
      } else {
        setResult({ ok: false, text: `❌ ${data.error}` });
      }
    } catch {
      setResult({ ok: false, text: '❌ Network error' });
    }
    setSending(false);
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
        🔔 Gửi Push Notification
      </h3>

      {/* Compose */}
      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Tiêu đề</label>
          <input
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200
                       focus:border-indigo-500 focus:outline-none"
            placeholder="e.g. 🎧 Thời gian trị liệu!"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Nội dung</label>
          <textarea
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200
                       focus:border-indigo-500 focus:outline-none resize-none"
            rows={2}
            placeholder="e.g. Hôm nay bạn chưa check-in. Tinni đang chờ!"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Đối tượng</label>
          <input
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200
                       focus:border-indigo-500 focus:outline-none font-mono"
            placeholder="all  hoặc  user-uuid"
            value={target}
            onChange={e => setTarget(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={send}
            disabled={sending || !title || !body}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500
                       text-white disabled:opacity-40 transition-colors">
            {sending ? 'Đang gửi...' : '🚀 Gửi ngay'}
          </button>
          {result && (
            <span className={`text-sm font-medium ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.text}
            </span>
          )}
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div>
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Lịch sử gửi gần nhất</h4>
          <div className="space-y-2">
            {logs.slice(0, 10).map(log => (
              <div key={log.id} className="rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3 flex gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{log.title}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{log.body}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-indigo-400">{log.sent_count} devices</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {new Date(log.sent_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
