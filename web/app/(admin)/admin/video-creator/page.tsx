'use client'
export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { Film, Download, RefreshCw, Eye, Plus, Trash2, ChevronUp, ChevronDown, Sparkles, Copy, Check, Image } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
interface Scene {
  id: string
  emoji: string
  title: string
  subtitle: string
  bg: string
  accent: string
}

interface Template {
  id: string
  label: string
  emoji: string
  desc: string
  scenes: Scene[]
  watermark: string
}

// ── Animation Presets ──────────────────────────────────────────────────────
const ANIMATION_PRESETS = [
  {
    id: 'aurora',
    label: 'Aurora',
    emoji: '🌌',
    desc: 'Cực quang nhẹ nhàng',
    mood: 'Bình yên, thư giãn, chữa lành',
    css: `
.anim-bg { position:absolute;inset:0;overflow:hidden; }
.anim-bg::before { content:'';position:absolute;inset:-50%;background:conic-gradient(from 0deg,transparent,var(--accent1),transparent,var(--accent2),transparent);animation:spin 8s linear infinite;opacity:0.15;filter:blur(60px); }
.anim-bg::after { content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 110%,var(--accent1)22,transparent 70%);animation:breathe 6s ease-in-out infinite; }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes breathe { 0%,100%{opacity:0.2}50%{opacity:0.5} }`,
  },
  {
    id: 'particles',
    label: 'Particles',
    emoji: '✨',
    desc: 'Hạt bụi lấp lánh',
    mood: 'Kỳ diệu, hy vọng, nhẹ nhàng',
    css: `
.anim-bg { position:absolute;inset:0; }
.particle { position:absolute;border-radius:50%;animation:float linear infinite; }
@keyframes float { 0%{transform:translateY(100vh) scale(0);opacity:0} 10%{opacity:1} 90%{opacity:0.6} 100%{transform:translateY(-10vh) scale(1);opacity:0} }`,
    js: `
const ab=document.querySelector('.anim-bg');
const colors=['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b'];
for(let i=0;i<25;i++){
  const p=document.createElement('div');
  p.className='particle';
  const s=Math.random()*6+2;
  p.style.cssText=\`width:\${s}px;height:\${s}px;background:\${colors[Math.floor(Math.random()*colors.length)]};left:\${Math.random()*100}%;bottom:-10px;animation-duration:\${Math.random()*8+4}s;animation-delay:\${Math.random()*6}s;opacity:0;\`;
  ab.appendChild(p);
}`,
  },
  {
    id: 'rain',
    label: 'Rain',
    emoji: '🌧️',
    desc: 'Mưa rơi nhẹ nhàng',
    mood: 'Bình tĩnh, thiền định, tĩnh lặng',
    css: `
.anim-bg { position:absolute;inset:0;overflow:hidden; }
.drop { position:absolute;width:1.5px;border-radius:1px;background:linear-gradient(transparent,rgba(255,255,255,0.4));animation:fall linear infinite; }
.anim-bg::before { content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(99,102,241,0.2),transparent 70%); }
@keyframes fall { 0%{transform:translateY(-100px);opacity:0} 10%{opacity:1} 100%{transform:translateY(800px);opacity:0} }`,
    js: `
const ab=document.querySelector('.anim-bg');
for(let i=0;i<40;i++){
  const d=document.createElement('div');
  d.className='drop';
  const h=Math.random()*60+20;
  d.style.cssText=\`height:\${h}px;left:\${Math.random()*100}%;animation-duration:\${Math.random()*1.5+0.8}s;animation-delay:\${Math.random()*3}s;\`;
  ab.appendChild(d);
}`,
  },
  {
    id: 'stars',
    label: 'Stars',
    emoji: '⭐',
    desc: 'Bầu trời sao đêm',
    mood: 'Sâu lắng, bí ẩn, kết nối vũ trụ',
    css: `
.anim-bg { position:absolute;inset:0;overflow:hidden; }
.star { position:absolute;border-radius:50%;background:#fff;animation:twinkle ease-in-out infinite; }
.anim-bg::before { content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 30% 70%,rgba(139,92,246,0.2),transparent 60%),radial-gradient(ellipse at 70% 30%,rgba(6,182,212,0.15),transparent 50%); }
@keyframes twinkle { 0%,100%{opacity:0.1;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`,
    js: `
const ab=document.querySelector('.anim-bg');
for(let i=0;i<60;i++){
  const s=document.createElement('div');
  s.className='star';
  const sz=Math.random()*3+1;
  s.style.cssText=\`width:\${sz}px;height:\${sz}px;left:\${Math.random()*100}%;top:\${Math.random()*100}%;animation-duration:\${Math.random()*3+1.5}s;animation-delay:\${Math.random()*4}s;\`;
  ab.appendChild(s);
}`,
  },
  {
    id: 'wave',
    label: 'Sound Wave',
    emoji: '〰️',
    desc: 'Sóng âm thanh',
    mood: 'Năng động, rung cảm, âm nhạc',
    css: `
.anim-bg { position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:4px; }
.wbar { width:3px;border-radius:3px;background:linear-gradient(to top,var(--accent1),var(--accent2));animation:pulse-bar ease-in-out infinite; }
@keyframes pulse-bar { 0%,100%{transform:scaleY(0.1)} 50%{transform:scaleY(1)} }`,
    js: `
const ab=document.querySelector('.anim-bg');
for(let i=0;i<50;i++){
  const b=document.createElement('div');
  b.className='wbar';
  b.style.cssText=\`height:\${Math.random()*200+40}px;animation-duration:\${Math.random()*0.8+0.4}s;animation-delay:\${Math.random()*0.6}s;opacity:\${Math.random()*0.5+0.15};\`;
  ab.appendChild(b);
}`,
  },
  {
    id: 'ripple',
    label: 'Ripple',
    emoji: '💫',
    desc: 'Gợn sóng lan tỏa',
    mood: 'Chữa lành, lan tỏa, yên bình',
    css: `
.anim-bg { position:absolute;inset:0;display:flex;align-items:center;justify-content:center; }
.ring { position:absolute;border-radius:50%;border:1px solid;animation:expand ease-out infinite; }
@keyframes expand { 0%{width:40px;height:40px;opacity:0.8;border-color:var(--accent1)} 100%{width:600px;height:600px;opacity:0;border-color:var(--accent2)} }`,
    js: `
const ab=document.querySelector('.anim-bg');
for(let i=0;i<5;i++){
  const r=document.createElement('div');
  r.className='ring';
  r.style.animationDelay=\`\${i*1.2}s\`;
  r.style.animationDuration='6s';
  ab.appendChild(r);
}`,
  },
  {
    id: 'geometric',
    label: 'Geometric',
    emoji: '🔷',
    desc: 'Hình học quay chuyển',
    mood: 'Tinh tế, khoa học, trí tuệ',
    css: `
.anim-bg { position:absolute;inset:0;overflow:hidden; }
.geo { position:absolute;border:1px solid;animation:geo-spin linear infinite; }
.geo-1 { width:200px;height:200px;top:10%;left:10%;border-color:var(--accent1)44;border-radius:4px;transform:rotate(0deg); }
.geo-2 { width:150px;height:150px;bottom:15%;right:5%;border-color:var(--accent2)33;border-radius:50%;animation-direction:reverse; }
.geo-3 { width:80px;height:80px;top:50%;left:70%;border-color:var(--accent1)55;border-radius:4px; }
@keyframes geo-spin { to{transform:rotate(360deg)} }`,
  },
  {
    id: 'bokeh',
    label: 'Bokeh',
    emoji: '🔵',
    desc: 'Ánh sáng mờ lãng mạn',
    mood: 'Cảm xúc, ấm áp, thân thuộc',
    css: `
.anim-bg { position:absolute;inset:0;overflow:hidden; }
.bokeh { position:absolute;border-radius:50%;filter:blur(20px);animation:drift ease-in-out infinite alternate; }
@keyframes drift { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(var(--dx),var(--dy)) scale(var(--ds))} }`,
    js: `
const ab=document.querySelector('.anim-bg');
const cols=['rgba(99,102,241,0.3)','rgba(139,92,246,0.25)','rgba(6,182,212,0.2)','rgba(16,185,129,0.2)','rgba(245,158,11,0.15)'];
for(let i=0;i<8;i++){
  const b=document.createElement('div');
  b.className='bokeh';
  const s=Math.random()*120+60;
  b.style.cssText=\`width:\${s}px;height:\${s}px;background:\${cols[i%cols.length]};left:\${Math.random()*100}%;top:\${Math.random()*100}%;animation-duration:\${Math.random()*4+3}s;animation-delay:\${Math.random()*2}s;--dx:\${(Math.random()-0.5)*60}px;--dy:\${(Math.random()-0.5)*60}px;--ds:\${Math.random()*0.5+0.8};\`;
  ab.appendChild(b);
}`,
  },
]

const MOOD_OPTIONS = [
  { id: 'healing', label: '🧘 Chữa lành', desc: 'Bình yên, thư giãn, dịu dàng' },
  { id: 'energetic', label: '⚡ Năng động', desc: 'Mạnh mẽ, khích lệ, tích cực' },
  { id: 'science', label: '🔬 Khoa học', desc: 'Tin tưởng, chuyên nghiệp, nghiêm túc' },
  { id: 'emotional', label: '💙 Cảm xúc', desc: 'Đồng cảm, chia sẻ, gần gũi' },
  { id: 'mystical', label: '🌌 Huyền bí', desc: 'Sâu lắng, bí ẩn, kết nối tâm linh' },
  { id: 'hope', label: '🌅 Hy vọng', desc: 'Lạc quan, tươi sáng, đổi mới' },
]

// ── Built-in Templates ──────────────────────────────────────────────
const TEMPLATES: Template[] = [
  {
    id: 'white_noise',
    label: 'White Noise Therapy',
    emoji: '🌊',
    desc: 'Âm thanh trị liệu ù tai',
    watermark: '@tinnimate • tinnitus.vuinghe.com',
    scenes: [
      { id: '1', emoji: '🌊', title: 'White Noise\ngiúp bạn ngủ ngon', subtitle: 'Âm thanh trị liệu che phủ tiếng ù tai\ngiúp não bộ thư giãn và dễ ngủ hơn', bg: 'linear-gradient(135deg,#10b981,#3b82f6)', accent: '#10b981' },
      { id: '2', emoji: '🎧', title: '11 âm thanh trị liệu', subtitle: 'White • Pink • Brown Noise\nMưa • Sóng biển • Rừng đêm\nLửa trại • Zen Bells • 528Hz', bg: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', accent: '#3b82f6' },
      { id: '3', emoji: '🌙', title: 'Nghe thử ngay đêm nay', subtitle: 'Miễn phí • Không cần tải app\ntinnitus.vuinghe.com', bg: 'linear-gradient(135deg,#8b5cf6,#ec4899)', accent: '#8b5cf6' },
    ],
  },
  {
    id: 'notch_therapy',
    label: 'Notch Therapy',
    emoji: '🎯',
    desc: 'Liệu pháp Notch giảm ù tai',
    watermark: '@tinnimate • tinnitus.vuinghe.com',
    scenes: [
      { id: '1', emoji: '🎯', title: 'Notch Therapy\nlà gì?', subtitle: 'Phương pháp lọc tần số ù tai\nbằng âm nhạc đặc biệt', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', accent: '#f59e0b' },
      { id: '2', emoji: '🧠', title: 'Cơ chế hoạt động', subtitle: 'Loại bỏ tần số ù tai khỏi nhạc\nNão bộ tự điều chỉnh lại\nTiếng ù giảm dần theo tuần', bg: 'linear-gradient(135deg,#ef4444,#8b5cf6)', accent: '#ef4444' },
      { id: '3', emoji: '✅', title: 'Thử ngay hôm nay', subtitle: 'Miễn phí trên Tinnimate\nChỉ cần tai nghe stereo', bg: 'linear-gradient(135deg,#10b981,#06b6d4)', accent: '#10b981' },
    ],
  },
  {
    id: 'breathing',
    label: 'Breathing Exercise',
    emoji: '🌬️',
    desc: 'Kỹ thuật thở 4-7-8',
    watermark: '@tinnimate • tinnitus.vuinghe.com',
    scenes: [
      { id: '1', emoji: '🌬️', title: 'Kỹ thuật thở 4-7-8\ngiảm lo âu tức thì', subtitle: 'Được bác sĩ khuyên dùng\ncho người bị ù tai', bg: 'linear-gradient(135deg,#06b6d4,#3b82f6)', accent: '#06b6d4' },
      { id: '2', emoji: '⏱️', title: 'Hít vào 4 giây\nGiữ 7 giây\nThở ra 8 giây', subtitle: 'Kích hoạt hệ thần kinh phó giao cảm\nGiảm cortisol ngay lập tức', bg: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', accent: '#3b82f6' },
      { id: '3', emoji: '🧘', title: 'Luyện tập ngay\ntrên Tinnimate', subtitle: '3 bài tập hơi thở có hướng dẫn\nMiễn phí hoàn toàn', bg: 'linear-gradient(135deg,#8b5cf6,#10b981)', accent: '#8b5cf6' },
    ],
  },
  {
    id: 'custom',
    label: 'Video Tùy Chỉnh',
    emoji: '✏️',
    desc: 'Tạo từ đầu hoàn toàn',
    watermark: '@tinnimate • tinnitus.vuinghe.com',
    scenes: [
      { id: '1', emoji: '✨', title: 'Tiêu đề cảnh 1', subtitle: 'Nội dung mô tả cảnh 1\nDòng thứ hai', bg: 'linear-gradient(135deg,#4f46e5,#7c3aed)', accent: '#6366f1' },
      { id: '2', emoji: '🎯', title: 'Tiêu đề cảnh 2', subtitle: 'Nội dung mô tả cảnh 2\nDòng thứ hai', bg: 'linear-gradient(135deg,#0ea5e9,#6366f1)', accent: '#0ea5e9' },
    ],
  },
]

const BG_OPTIONS = [
  { label: 'Xanh lá → Xanh dương', value: 'linear-gradient(135deg,#10b981,#3b82f6)', accent: '#10b981' },
  { label: 'Xanh dương → Tím', value: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', accent: '#3b82f6' },
  { label: 'Tím → Hồng', value: 'linear-gradient(135deg,#8b5cf6,#ec4899)', accent: '#8b5cf6' },
  { label: 'Vàng → Đỏ', value: 'linear-gradient(135deg,#f59e0b,#ef4444)', accent: '#f59e0b' },
  { label: 'Cyan → Xanh dương', value: 'linear-gradient(135deg,#06b6d4,#3b82f6)', accent: '#06b6d4' },
  { label: 'Xanh lá → Cyan', value: 'linear-gradient(135deg,#10b981,#06b6d4)', accent: '#10b981' },
  { label: 'Indigo → Tím', value: 'linear-gradient(135deg,#4f46e5,#7c3aed)', accent: '#6366f1' },
  { label: 'Đỏ → Tím', value: 'linear-gradient(135deg,#ef4444,#8b5cf6)', accent: '#ef4444' },
]

// ── HTML Generator ──────────────────────────────────────────────────────────
function generateHTML(scenes: Scene[], watermark: string, animationId: string, bgImageUrl: string): string {
  const anim = ANIMATION_PRESETS.find(a => a.id === animationId) ?? ANIMATION_PRESETS[0]
  const sceneTimings = scenes.map((_, i) => 1000 + i * 9500)

  const accent1 = scenes[0]?.accent ?? '#6366f1'
  const accent2 = scenes[Math.floor(scenes.length / 2)]?.accent ?? '#8b5cf6'

  const sceneDivs = scenes.map((s, i) => `
  <div class="scene s${i + 1}" style="--accent1:${s.accent};--accent2:${scenes[(i+1)%scenes.length]?.accent ?? s.accent}">
    <div class="anim-bg"></div>
    ${bgImageUrl ? `<div class="bg-image" style="background-image:url('${bgImageUrl}')"></div>` : ''}
    <div class="scene-content">
      <div class="emoji" style="animation-delay:0.3s">${s.emoji}</div>
      <div class="title" style="animation-delay:0.5s">${s.title.replace(/\n/g, '<br>')}</div>
      <div class="subtitle" style="animation-delay:0.8s">${s.subtitle.replace(/\n/g, '<br>')}</div>
      <div class="pbar"><div class="pbar-fill" style="width:${((i+1)/scenes.length*100).toFixed(0)}%"></div></div>
    </div>
  </div>`).join('\n')

  const initJs = anim.js ? scenes.map((_, i) =>
    `if(document.querySelector('.s${i+1} .anim-bg')){const _ab=document.querySelector('.anim-bg');` +
    anim.js!.trim() + '}'
  ).join('\n') : ''

  const timerScript = `
const _scenes=document.querySelectorAll('.scene');
const _timings=[${sceneTimings.join(',')}];
_scenes.forEach((sc,i)=>{
  setTimeout(()=>{sc.style.transition='opacity 0.8s ease,transform 0.8s ease';sc.style.opacity='1';sc.style.transform='translateY(0)';},_timings[i]);
  if(i<_scenes.length-1){setTimeout(()=>{sc.style.transition='opacity 0.5s ease';sc.style.opacity='0';},_timings[i]+8600);}
});`

  const animJs = anim.js ? `
(function(){
  document.querySelectorAll('.anim-bg').forEach(ab=>{
    ${anim.js}
  });
})();` : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:420px; height:746px; overflow:hidden; background:#020617; font-family:'Segoe UI',system-ui,sans-serif; color:#fff; --accent1:${accent1}; --accent2:${accent2}; }
.scene { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:40px 24px; opacity:0; transform:translateY(30px); }
.bg-image { position:absolute; inset:0; background-size:cover; background-position:center; opacity:0.18; }
${anim.css}
.scene-content { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; }
.emoji { font-size:72px; margin-bottom:20px; animation:bounceIn 0.6s both; }
.title { font-size:24px; font-weight:800; line-height:1.3; margin-bottom:16px; text-shadow:0 2px 20px rgba(0,0,0,0.5); animation:slideUp 0.6s both; }
.subtitle { font-size:13px; color:rgba(255,255,255,0.65); line-height:1.8; text-shadow:0 1px 8px rgba(0,0,0,0.8); animation:slideUp 0.6s 0.2s both; }
.pbar { width:80px; height:3px; background:rgba(255,255,255,0.1); border-radius:2px; margin-top:28px; animation:fadeIn 0.5s 1s both; }
.pbar-fill { height:100%; border-radius:2px; background:rgba(255,255,255,0.6); }
.watermark { position:absolute; bottom:20px; left:50%; transform:translateX(-50%); font-size:10px; color:rgba(255,255,255,0.2); white-space:nowrap; z-index:10; }
@keyframes bounceIn { 0%{opacity:0;transform:scale(0.5)} 70%{transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
</style></head>
<body>
${sceneDivs}
<div class="watermark">${watermark}</div>
<script>
(function(){
${timerScript}
${animJs}
})();
</script>
</body></html>`
}

// ── Scene Editor ────────────────────────────────────────────────────────────
function SceneEditor({ scene, index, total, onChange, onDelete, onMove }: {
  scene: Scene; index: number; total: number
  onChange: (s: Scene) => void; onDelete: () => void; onMove: (dir: -1 | 1) => void
}) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scene {index + 1}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={index === 0}
            className="p-1 rounded hover:bg-white/5 text-slate-500 disabled:opacity-30"><ChevronUp size={14} /></button>
          <button onClick={() => onMove(1)} disabled={index === total - 1}
            className="p-1 rounded hover:bg-white/5 text-slate-500 disabled:opacity-30"><ChevronDown size={14} /></button>
          <button onClick={onDelete}
            className="p-1 rounded hover:bg-red-500/15 text-slate-600 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Emoji</label>
          <input value={scene.emoji} onChange={e => onChange({ ...scene, emoji: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-center text-xl" maxLength={4} />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">Màu gradient</label>
          <select value={scene.bg} onChange={e => {
            const opt = BG_OPTIONS.find(o => o.value === e.target.value)
            onChange({ ...scene, bg: e.target.value, accent: opt?.accent ?? '#6366f1' })
          }} className="w-full px-2 py-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white">
            {BG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-slate-500 block mb-1">Tiêu đề (\\n = xuống dòng)</label>
          <input value={scene.title} onChange={e => onChange({ ...scene, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white" />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-slate-500 block mb-1">Nội dung (\\n = xuống dòng)</label>
          <textarea value={scene.subtitle} onChange={e => onChange({ ...scene, subtitle: e.target.value })}
            rows={2} className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white resize-none" />
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function VideoCreatorPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0])
  const [scenes, setScenes] = useState<Scene[]>(TEMPLATES[0].scenes)
  const [watermark, setWatermark] = useState(TEMPLATES[0].watermark)
  const [animationId, setAnimationId] = useState('aurora')
  const [mood, setMood] = useState('healing')
  const [bgImageUrl, setBgImageUrl] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [generatingPrompt, setGeneratingPrompt] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [showPreview, setShowPreview] = useState(false)

  const callBgApi = useCallback(async (withImage: boolean) => {
    if (withImage) setGeneratingImage(true)
    else setGeneratingPrompt(true)
    setGeneratedPrompt('')  // clear previous
    try {
      const anim = ANIMATION_PRESETS.find(a => a.id === animationId)
      const moodLabel = MOOD_OPTIONS.find(m => m.id === mood)?.desc ?? mood
      const res = await fetch('/api/admin/video-bg-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes, animationStyle: anim?.label, mood: moodLabel, generateImage: withImage }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGeneratedPrompt(`❌ Lỗi ${res.status}: ${data.error ?? 'Unknown error'}`)
      } else {
        if (data.prompt) setGeneratedPrompt(data.prompt)
        if (data.imageDataUrl) {
          setBgImageUrl(data.imageDataUrl)
          setPreviewKey(k => k + 1)
        }
      }
    } catch (e) {
      setGeneratedPrompt('❌ Lỗi kết nối: ' + String(e))
    }
    if (withImage) setGeneratingImage(false)
    else setGeneratingPrompt(false)
  }, [scenes, animationId, mood])

  const generateBgPrompt = useCallback(() => callBgApi(false), [callBgApi])
  const generateBgImage  = useCallback(() => callBgApi(true),  [callBgApi])

  const loadTemplate = (t: Template) => {
    setSelectedTemplate(t)
    setScenes(t.scenes.map(s => ({ ...s, id: crypto.randomUUID() })))
    setWatermark(t.watermark)
    setPreviewKey(k => k + 1)
  }

  const updateScene = (i: number, s: Scene) => setScenes(ss => ss.map((x, j) => j === i ? s : x))
  const deleteScene = (i: number) => setScenes(ss => ss.filter((_, j) => j !== i))
  const addScene = () => setScenes(ss => [...ss, {
    id: crypto.randomUUID(), emoji: '✨', title: 'Tiêu đề mới',
    subtitle: 'Nội dung mô tả\nDòng thứ hai',
    bg: BG_OPTIONS[ss.length % BG_OPTIONS.length].value,
    accent: BG_OPTIONS[ss.length % BG_OPTIONS.length].accent,
  }])
  const moveScene = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= scenes.length) return
    setScenes(ss => { const a = [...ss]; [a[i], a[j]] = [a[j], a[i]]; return a })
  }
  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  const html = generateHTML(scenes, watermark, animationId, bgImageUrl)
  const totalDuration = Math.round((1 + scenes.length * 9.5) / 60 * 10) / 10

  return (
    <div className="p-6 lg:p-8 flex gap-6 min-h-screen">

      {/* ── Left Panel ── */}
      <div className="flex-1 min-w-0 max-w-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Film size={22} className="text-violet-400" /> Video Creator
          </h1>
          <p className="text-slate-400 text-sm mt-1">Tạo video animation HTML → quay màn hình → TikTok/Reels</p>
        </div>

        {/* Template picker */}
        <div className="mb-5">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Template</p>
          <div className="grid grid-cols-4 gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => loadTemplate(t)}
                className={`p-3 rounded-xl border text-left transition-all ${selectedTemplate.id === t.id
                  ? 'bg-violet-600/20 border-violet-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/15'}`}>
                <div className="text-xl mb-1">{t.emoji}</div>
                <div className="text-[11px] font-semibold text-white leading-tight">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Animation Presets ── */}
        <div className="mb-5">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">🎨 Animation Toàn Màn Hình</p>
          <div className="grid grid-cols-4 gap-2">
            {ANIMATION_PRESETS.map(a => (
              <button key={a.id} onClick={() => setAnimationId(a.id)}
                className={`p-2.5 rounded-xl border text-center transition-all ${animationId === a.id
                  ? 'bg-cyan-600/20 border-cyan-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/15'}`}>
                <div className="text-xl mb-0.5">{a.emoji}</div>
                <div className="text-[10px] font-semibold text-white">{a.label}</div>
                <div className="text-[9px] text-slate-600 mt-0.5 leading-tight">{a.desc}</div>
              </button>
            ))}
          </div>
          {animationId && (
            <p className="text-[10px] text-cyan-400 mt-2 pl-1">
              💡 {ANIMATION_PRESETS.find(a => a.id === animationId)?.mood}
            </p>
          )}
        </div>

        {/* ── Mood ── */}
        <div className="mb-5">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">🎭 Cảm Xúc Chủ Đạo</p>
          <div className="grid grid-cols-3 gap-2">
            {MOOD_OPTIONS.map(m => (
              <button key={m.id} onClick={() => setMood(m.id)}
                className={`px-3 py-2 rounded-xl border text-left transition-all ${mood === m.id
                  ? 'bg-amber-600/20 border-amber-500/40' : 'bg-white/[0.02] border-white/5 hover:border-white/15'}`}>
                <div className="text-[11px] font-semibold text-white">{m.label}</div>
                <div className="text-[9px] text-slate-600 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Scene Editors ── */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Cảnh ({scenes.length}) · ~{totalDuration} phút
            </p>
            <button onClick={addScene} disabled={scenes.length >= 6}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-lg text-xs text-violet-300 disabled:opacity-40 transition-colors">
              <Plus size={12} /> Thêm cảnh
            </button>
          </div>
          {scenes.map((s, i) => (
            <SceneEditor key={s.id} scene={s} index={i} total={scenes.length}
              onChange={sc => updateScene(i, sc)}
              onDelete={() => deleteScene(i)}
              onMove={dir => moveScene(i, dir)} />
          ))}
        </div>

        {/* ── Background Image ── */}
        <div className="mb-5 bg-white/[0.02] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Image size={14} className="text-emerald-400" />
            <p className="text-xs font-semibold text-white">Ảnh Nền Video</p>
            <span className="text-[10px] text-slate-600">· tuỳ chọn</span>
          </div>

          {/* AI Prompt Generator */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-slate-500">Gemini AI tạo prompt + ảnh nền theo context video:</p>
              <div className="flex gap-2">
                <button onClick={generateBgPrompt} disabled={generatingPrompt || generatingImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 border border-white/10 rounded-lg text-xs text-white disabled:opacity-50 transition-all">
                  <Sparkles size={11} className={generatingPrompt ? 'animate-spin' : ''} />
                  {generatingPrompt ? 'Generating...' : 'Prompt only'}
                </button>
                <button onClick={generateBgImage} disabled={generatingPrompt || generatingImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 hover:from-emerald-600/60 hover:to-cyan-600/60 border border-emerald-500/30 rounded-lg text-xs text-white font-semibold disabled:opacity-50 transition-all">
                  <Image size={11} className={generatingImage ? 'animate-pulse' : ''} />
                  {generatingImage ? '✨ Đang tạo ảnh...' : '✨ Generate Image'}
                </button>
              </div>
            </div>

            {generatedPrompt && (
              <div className="relative">
                <textarea
                  value={generatedPrompt}
                  onChange={e => setGeneratedPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 pr-10 bg-slate-900 border border-emerald-500/20 rounded-lg text-xs text-emerald-200 resize-none leading-relaxed"
                />
                <button onClick={copyPrompt}
                  className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                  {promptCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
                <p className="text-[9px] text-slate-600 mt-1">Dùng prompt này trên Midjourney / DALL-E / Leonardo AI để tạo ảnh nền</p>
              </div>
            )}
          </div>

          {/* URL input */}
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Hoặc dán URL ảnh đã có sẵn:</p>
            <input value={bgImageUrl} onChange={e => setBgImageUrl(e.target.value)}
              placeholder="https://example.com/background.jpg"
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-700" />
            {bgImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bgImageUrl} alt="bg preview"
                className="mt-2 w-full h-20 object-cover rounded-lg opacity-60 border border-white/10" />
            )}
          </div>
        </div>

        {/* Watermark */}
        <div className="mb-5">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Watermark</p>
          <input value={watermark} onChange={e => setWatermark(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-5">
          <button onClick={() => { setPreviewKey(k => k + 1); setShowPreview(true) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors">
            <Eye size={16} className="text-cyan-400" /> Preview
          </button>
          <button onClick={() => { setPreviewKey(k => k + 1) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors">
            <RefreshCw size={14} className="text-slate-400" /> Reload
          </button>
          <button onClick={() => {
            const blob = new Blob([html], { type: 'text/html' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `tinnimate_video_${Date.now()}.html`; a.click()
            URL.revokeObjectURL(url)
          }} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm text-white font-semibold transition-colors shadow-lg shadow-violet-600/30">
            <Download size={16} /> Download HTML
          </button>
        </div>

        {/* Guide */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-xs text-slate-500 space-y-1.5">
          <p className="text-slate-300 font-semibold mb-2">📹 Quy trình tạo video:</p>
          <p>1️⃣ Chọn animation + mood → Chỉnh nội dung từng cảnh</p>
          <p>2️⃣ Nhấn <strong className="text-violet-300">Tạo prompt AI</strong> → Dùng prompt tạo ảnh nền trên Midjourney</p>
          <p>3️⃣ Dán URL ảnh vào ô ảnh nền → Preview xem kết quả</p>
          <p>4️⃣ <strong className="text-white">Download HTML</strong> → Mở Chrome → OBS quay màn hình</p>
          <p>5️⃣ Upload lên TikTok / Reels / YouTube Shorts</p>
        </div>
      </div>

      {/* ── Right Panel: Preview ── */}
      {showPreview && (
        <div className="w-[260px] flex-shrink-0">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live Preview</p>
              <button onClick={() => setPreviewKey(k => k + 1)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-400 transition-colors">
                <RefreshCw size={11} /> Replay
              </button>
            </div>
            {/* Phone frame */}
            <div className="relative bg-slate-900 rounded-[32px] p-3 border border-white/10 shadow-2xl mx-auto" style={{ width: 252 }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-xl z-10" />
              <div className="overflow-hidden rounded-[22px]" style={{ width: 228, height: 406 }}>
                <iframe
                  key={previewKey}
                  srcDoc={html}
                  style={{ width: 420, height: 746, transform: 'scale(0.543)', transformOrigin: 'top left', border: 'none' }}
                  title="Video Preview"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 text-center mt-3">{scenes.length} cảnh · ~{totalDuration} phút</p>
            <p className="text-[10px] text-cyan-600 text-center mt-1">
              {ANIMATION_PRESETS.find(a => a.id === animationId)?.emoji} {ANIMATION_PRESETS.find(a => a.id === animationId)?.label}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
