import Link from 'next/link'

const features = [
  { icon: '💬', title: 'AI Chat', desc: 'Chia sẻ cảm xúc với Tinni — AI chuyên biệt về ù tai, hỗ trợ 24/7', color: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/20' },
  { icon: '🎧', title: 'Sound Therapy', desc: 'White noise, binaural beats, âm thanh thiên nhiên tổng hợp realtime', color: 'from-violet-500 to-purple-400', glow: 'shadow-violet-500/20' },
  { icon: '👂', title: 'Hearing Test', desc: 'Đo ngưỡng nghe 6 tần số, xác định tần số ù tai ngay trên trình duyệt', color: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/20' },
  { icon: '📋', title: 'Clinical Assessment', desc: 'THI, PHQ-9, GAD-7, ISI — bộ câu hỏi chuẩn quốc tế, AI phân tích', color: 'from-amber-500 to-orange-400', glow: 'shadow-amber-500/20' },
  { icon: '🧘', title: 'Relaxation', desc: 'Hít thở 4-7-8, box breathing, thư giãn cơ cùng haptic feedback', color: 'from-pink-500 to-rose-400', glow: 'shadow-pink-500/20' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Biểu đồ mood, giấc ngủ, mức ù tai theo thời gian — đo lường hiệu quả', color: 'from-indigo-500 to-blue-400', glow: 'shadow-indigo-500/20' },
]

const plans = [
  {
    name: 'Free', price: '0đ', period: '/tháng', highlight: false,
    features: ['5 tin nhắn/ngày', '3 preset âm thanh', '1 kiểm tra tai/tháng', '1 bộ câu hỏi/tháng'],
    cta: 'Bắt đầu miễn phí', href: '/signup',
  },
  {
    name: 'Premium', price: '249K', period: '/tháng', highlight: true,
    features: ['Chat không giới hạn', 'Toàn bộ âm thanh trị liệu', 'Notch therapy cá nhân hóa', 'Tất cả bộ câu hỏi', 'Biểu đồ tiến triển', 'Bài tập thư giãn + haptic'],
    cta: 'Nâng cấp Premium', href: '/signup',
  },
  {
    name: 'Pro', price: '499K', period: '/tháng', highlight: false,
    features: ['Mọi tính năng Premium', 'Xuất báo cáo PDF', 'Tư vấn chuyên gia thính học', 'Chia sẻ gia đình (3 người)', 'API access'],
    cta: 'Nâng cấp Pro', href: '/signup',
  },
]

const chatPreview = [
  { role: 'assistant', content: 'Xin chào! Tôi là Tinni 💙 Hôm nay bạn cảm thấy thế nào?' },
  { role: 'user', content: 'Tai tôi đang ù khá nhiều, khó ngủ lắm...' },
  { role: 'assistant', content: 'Tôi hiểu, thực sự rất khó chịu 😔 Để tôi bật White Noise giúp bạn thư giãn nhé?' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-hidden">

      {/* Animated background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-emerald-600/10 blur-[100px] animate-pulse [animation-delay:4s]" />
        <div className="absolute top-[60%] left-[10%] w-[300px] h-[300px] rounded-full bg-pink-600/10 blur-[100px] animate-pulse [animation-delay:3s]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#020617]/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold">T</div>
            <span className="font-bold text-lg text-white">TinniMate</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Tính năng</a>
            <a href="#how" className="hover:text-white transition-colors">Cách hoạt động</a>
            <a href="#pricing" className="hover:text-white transition-colors">Bảng giá</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
              Đăng nhập
            </Link>
            <Link href="/signup" className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/25">
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              AI-Powered Tinnitus Care
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-white via-blue-100 to-violet-200 bg-clip-text text-transparent">
                Đồng hành cùng
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                ù tai của bạn
              </span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-md leading-relaxed">
              AI chuyên biệt, liệu pháp âm thanh, kiểm tra thính lực — tất cả trong một ứng dụng giúp bạn kiểm soát tinnitus hiệu quả.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/signup" className="group flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full font-medium transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
                Bắt đầu miễn phí
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <a href="#features" className="px-6 py-3.5 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white rounded-full text-sm transition-all hover:bg-white/5">
                Tìm hiểu thêm
              </a>
            </div>
            {/* Stats */}
            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/5">
              {[
                { value: '10K+', label: 'Người dùng' },
                { value: '50K+', label: 'Phiên trị liệu' },
                { value: '4.8★', label: 'Đánh giá' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat preview with glassmorphism */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 via-violet-500/10 to-transparent blur-2xl rounded-3xl" />
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs text-slate-500">Chat với Tinni 💙</span>
              </div>
              <div className="space-y-4">
                {chatPreview.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs flex-shrink-0">💙</div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                        : 'bg-white/[0.06] text-slate-200 border border-white/5'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              {/* Fake tool call card */}
              <div className="mt-3 ml-9 bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 text-green-400 text-xs font-medium">🎧 Đang bật White Noise — 30 phút</div>
                <div className="mt-2 w-full bg-white/5 rounded-full h-1">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-1 rounded-full w-[35%]" />
                </div>
              </div>
              {/* Input bar */}
              <div className="flex items-center gap-2 mt-5 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5">
                <span className="text-slate-500 text-sm flex-1">Nhắn tin cho Tinni...</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center text-xs">↑</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Tính năng</span> nổi bật
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">Tất cả công cụ bạn cần để kiểm soát ù tai, trong một nền tảng duy nhất</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title}
                className={`group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${f.glow}`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-xl mb-4 shadow-lg ${f.glow}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cách <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">hoạt động</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Chia sẻ', desc: 'Nói chuyện với Tinni về triệu chứng, cảm xúc, khó khăn của bạn', color: 'from-blue-500 to-cyan-400' },
              { step: '02', title: 'Khám phá', desc: 'AI phân tích và đề xuất liệu pháp âm thanh, bài tập phù hợp', color: 'from-violet-500 to-purple-400' },
              { step: '03', title: 'Cải thiện', desc: 'Theo dõi tiến triển, điều chỉnh liệu pháp, cải thiện mỗi ngày', color: 'from-emerald-500 to-teal-400' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-lg`}>
                  {s.step}
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Bảng giá</span> đơn giản
            </h2>
            <p className="text-slate-400">Bắt đầu miễn phí, nâng cấp khi bạn cần</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(p => (
              <div key={p.name}
                className={`relative rounded-2xl p-6 transition-all duration-300 ${
                  p.highlight
                    ? 'bg-gradient-to-b from-blue-500/10 to-violet-500/5 border-2 border-blue-500/30 shadow-xl shadow-blue-500/10'
                    : 'bg-white/[0.02] border border-white/5 hover:border-white/10'
                }`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full text-xs font-medium text-white">
                    Phổ biến nhất
                  </div>
                )}
                <div className="mb-6 pt-2">
                  <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold text-white">{p.price}</span>
                    <span className="text-slate-500 text-sm">{p.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href}
                  className={`w-full flex items-center justify-center py-3 rounded-xl font-medium text-sm transition-all ${
                    p.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
                  }`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-pink-600/20 blur-3xl rounded-full" />
            <div className="relative bg-white/[0.02] backdrop-blur border border-white/5 rounded-3xl p-12">
              <h2 className="text-3xl font-bold mb-4">Sẵn sàng kiểm soát ù tai?</h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">Hàng ngàn người đã cải thiện chất lượng cuộc sống với TinniMate. Bắt đầu hành trình của bạn ngay hôm nay.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full font-medium text-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
                Bắt đầu miễn phí →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">T</div>
            TinniMate — Đồng hành cùng ù tai
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <a href="#" className="hover:text-slate-400 transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
