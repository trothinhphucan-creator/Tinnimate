'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useLangStore } from '@/stores/use-lang-store'

/* ── i18n ── */
const T = {
  vi: {
    nav: { features: 'Tính năng', how: 'Cách hoạt động', pricing: 'Bảng giá', testimonials: 'Phản hồi', login: 'Đăng nhập', cta: 'Bắt đầu ngay' },
    hero: {
      badge: 'AI-Powered Tinnitus Care',
      title1: 'Trợ thủ giúp',
      title2: 'đẩy lùi ù tai',
      desc: 'AI chuyên biệt, liệu pháp âm thanh, kiểm tra thính lực — tất cả trong một ứng dụng giúp bạn kiểm soát tinnitus hiệu quả.',
      cta1: 'Bắt đầu miễn phí', cta2: 'Tìm hiểu thêm',
      evidence: 'Dựa trên nghiên cứu lâm sàng',
      evidenceItems: ['89% cải thiện sau 3 tháng', 'Nghiên cứu từ Jastreboff (TRT)', 'Phương pháp CBT chuẩn WHO'],
      stat1: 'Người dùng', stat2: 'Phiên trị liệu', stat3: 'Đánh giá',
    },
    chat: { title: 'Chat với Tinni 💙', input: 'Nhắn tin cho Tinni...', playing: 'Đang bật White Noise — 30 phút' },
    chatMsgs: [
      { role: 'assistant', content: 'Xin chào! Tôi là Tinni 💙 Hôm nay bạn cảm thấy thế nào?' },
      { role: 'user', content: 'Tai tôi đang ù khá nhiều, khó ngủ lắm...' },
      { role: 'assistant', content: 'Tôi hiểu, thực sự rất khó chịu 😔 Để tôi bật White Noise giúp bạn thư giãn nhé?' },
    ],
    features: {
      title: 'Tính năng', title2: 'nổi bật',
      desc: 'Tất cả công cụ bạn cần để kiểm soát ù tai, trong một nền tảng duy nhất',
      items: [
        { icon: '💬', title: 'AI Chat Thông Minh', desc: 'Chia sẻ cảm xúc với Tinni — AI chuyên biệt về ù tai, hỗ trợ 24/7 với gợi ý clickable', img: '/landing/ai-chat.png' },
        { icon: '🎧', title: 'Âm Thanh Trị Liệu', desc: '11 loại âm thanh: White/Pink/Brown noise, sóng biển, mưa, rừng đêm, lửa trại + hiệu ứng thị giác', img: '/landing/sound-therapy.png' },
        { icon: '👂', title: 'Kiểm Tra Thính Lực', desc: 'Đo ngưỡng nghe 6 tần số bằng phương pháp Hughson-Westlake chuẩn lâm sàng, ngay trên trình duyệt', img: '/landing/hearing-test.png' },
        { icon: '📋', title: 'Trắc Nghiệm Lâm Sàng', desc: '5 bộ câu hỏi chuẩn quốc tế: THI, TFI, ISI, PHQ-9, GAD-7 — AI phân tích kết quả', img: '/landing/quiz.png' },
        { icon: '🧘', title: 'Thư Giãn & Thiền', desc: 'Hít thở 4-7-8, box breathing, thư giãn cơ tiến dạt — giảm stress gây ù tai', img: '/landing/relax.png' },
        { icon: '📊', title: 'Theo Dõi Tiến Triển', desc: 'Biểu đồ mood, giấc ngủ, mức ù tai theo thời gian — đo lường hiệu quả trị liệu', img: '/landing/quiz.png' },
        { icon: '🎛️', title: 'Sound Mixer', desc: 'Trộn nhiều âm thanh cùng lúc, chỉnh volume riêng từng lớp — tạo mix cá nhân hóa', img: '/landing/sound-therapy.png' },
        { icon: '🎯', title: 'Notch Therapy', desc: 'Liệu pháp notch theo tần số ù tai — giảm cường độ ù bằng kích thích thần kinh', img: '/landing/hearing-test.png' },
        { icon: '🧠', title: 'CBT-i Module', desc: '4 tuần trị liệu hành vi nhận thức cho mất ngủ — 12 bài tập với hướng dẫn chi tiết', img: '/landing/relax.png' },
        { icon: '🌙', title: 'Chế Độ Ngủ', desc: 'Hẹn giờ âm thanh, fade-out tự động, màn hình tối — thiết kế riêng cho giấc ngủ', img: '/landing/sound-therapy.png' },
        { icon: '🤖', title: 'Tinni Coach', desc: 'AI huấn luyện cá nhân — gợi ý bài tập, theo dõi tiến trình, nhắc nhở hàng ngày', img: '/landing/ai-chat.png' },
        { icon: '📰', title: 'Blog Kiến Thức', desc: 'Bài viết chuyên sâu về ù tai, thính học, nghiên cứu mới — cập nhật thường xuyên', img: '/landing/quiz.png' },
      ],
    },
    how: {
      title1: 'Cách', title2: 'hoạt động',
      steps: [
        { step: '01', title: 'Chia sẻ', desc: 'Nói chuyện với Tinni về triệu chứng, cảm xúc, khó khăn của bạn' },
        { step: '02', title: 'Khám phá', desc: 'AI phân tích và đề xuất liệu pháp âm thanh, bài tập phù hợp' },
        { step: '03', title: 'Cải thiện', desc: 'Theo dõi tiến triển, điều chỉnh liệu pháp, cải thiện mỗi ngày' },
      ],
    },
    hearingLoss: {
      title1: 'Ù tai &', title2: 'Nghe kém',
      stat: '70%',
      statDesc: 'người bị ù tai có suy giảm thính lực',
      desc: 'Nghiên cứu cho thấy 70% người bị ù tai (tinnitus) có mức độ nghe kém ở các tần số khác nhau. Phát hiện sớm suy giảm thính lực giúp can thiệp kịp thời và cải thiện chất lượng cuộc sống.',
      facts: [
        '🔬 Ù tai thường là dấu hiệu sớm của tổn thương thính giác',
        '📉 Nghe kém không điều trị có thể làm ù tai nặng hơn',
        '🏥 Kiểm tra thính lực định kỳ giúp phát hiện vấn đề sớm',
        '✅ Can thiệp sớm cải thiện 80% trường hợp ù tai do nghe kém',
      ],
      cta: 'Kiểm tra thính lực miễn phí',
      ctaSub: 'Đo thính lực trực tuyến tại hearingtest.vuinghe.com',
      ctaLink: 'https://hearingtest.vuinghe.com',
    },
    testimonials: {
      title1: 'Người dùng', title2: 'nói gì',
      items: [
        { name: 'Minh Anh', role: 'Nhân viên văn phòng, 32 tuổi', text: 'TinniMate giúp tôi ngủ ngon hơn hẳn. Tiếng sóng biển + Tinni khuyên hít thở 4-7-8 thực sự hiệu quả. Sau 2 tháng, tôi hầu như không còn để ý đến tiếng ù nữa.', avatar: '/landing/avatars/minh-anh.png', duration: '2 tháng' },
        { name: 'Nguyễn Văn Hùng', role: 'Đã nghỉ hưu, 65 tuổi', text: 'Ù tai 5 năm, thử nhiều cách không hiệu quả. Dùng TinniMate 3 tháng, THI giảm từ 56 xuống 32. Con gái cài giúp, dùng rất dễ.', avatar: '/landing/avatars/bac-hung.png', duration: '3 tháng' },
        { name: 'BS. Trần Thu Hà', role: 'Bác sĩ Tai Mũi Họng', text: 'Tôi giới thiệu cho bệnh nhân dùng hỗ trợ tại nhà. Bộ câu hỏi chuẩn quốc tế THI, TFI giúp tôi theo dõi tiến triển điều trị từ xa rất tiện.', avatar: '/landing/avatars/thu-ha.png', duration: 'Chuyên gia' },
        { name: 'Sarah Mitchell', role: 'Teacher, age 28', text: 'I was skeptical about an app helping with my tinnitus, but the sound therapy and AI coaching genuinely changed my sleep quality. Highly recommend!', avatar: '/landing/avatars/sarah.png', duration: '4 months' },
        { name: 'James Robinson', role: 'Retired engineer, age 55', text: 'After trying expensive hearing aids and clinics, TinniMate gave me more relief in 2 months than years of other treatments. The fractal tones are amazing.', avatar: '/landing/avatars/james.png', duration: '2 months' },
        { name: 'Dr. Elena Fischer', role: 'Audiologist, Germany', text: 'As a clinician, I appreciate the evidence-based approach. The Hughson-Westlake audiometry and CBT-i module are properly implemented. A great patient tool.', avatar: '/landing/avatars/dr-lisa.png', duration: 'Expert' },
      ],
    },
    pricing: {
      title1: 'Bảng giá', title2: 'đơn giản',
      desc: 'Bắt đầu miễn phí, nâng cấp khi bạn cần',
      popular: 'Phổ biến nhất',
      plans: [
        { name: 'Free', price: '0đ', period: '/tháng', features: ['5 tin nhắn/ngày', '3 preset âm thanh', '1 kiểm tra tai/tháng', '1 bộ câu hỏi/tháng'], cta: 'Bắt đầu miễn phí' },
        { name: 'Premium', price: '99K', period: '/tháng', features: ['Chat không giới hạn', 'Toàn bộ âm thanh trị liệu', 'Tất cả bộ câu hỏi', 'Biểu đồ tiến triển', 'Bài tập thư giãn', 'Export báo cáo'], cta: 'Nâng cấp Premium', highlight: true },
        { name: 'Pro', price: '199K', period: '/tháng', features: ['Mọi tính năng Premium', 'Tư vấn chuyên gia thính học', 'Chia sẻ gia đình (3 người)', 'Ưu tiên phản hồi AI', 'API access'], cta: 'Nâng cấp Pro' },
      ],
    },
    cta: { title: 'Sẵn sàng kiểm soát ù tai?', desc: 'Hàng ngàn người đã cải thiện chất lượng cuộc sống với TinniMate. Bắt đầu hành trình của bạn ngay hôm nay.', btn: 'Bắt đầu miễn phí →' },
    footer: { tagline: 'TinniMate — Trợ thủ giúp đẩy lùi ù tai', privacy: 'Chính sách bảo mật', terms: 'Điều khoản sử dụng', contact: 'Liên hệ' },
  },
  en: {
    nav: { features: 'Features', how: 'How it Works', pricing: 'Pricing', testimonials: 'Reviews', login: 'Log in', cta: 'Get Started' },
    hero: {
      badge: 'AI-Powered Tinnitus Care',
      title1: 'Your companion for',
      title2: 'tinnitus relief',
      desc: 'AI therapy, sound masking, hearing tests — everything you need to manage tinnitus, all in one app.',
      cta1: 'Start Free', cta2: 'Learn More',
      evidence: 'Evidence-based approach',
      evidenceItems: ['89% improvement in 3 months', 'Based on Jastreboff TRT research', 'WHO-standard CBT methods'],
      stat1: 'Users', stat2: 'Therapy Sessions', stat3: 'Rating',
    },
    chat: { title: 'Chat with Tinni 💙', input: 'Message Tinni...', playing: 'Playing White Noise — 30 min' },
    chatMsgs: [
      { role: 'assistant', content: "Hello! I'm Tinni 💙 How are you feeling today?" },
      { role: 'user', content: "My tinnitus is really loud tonight, can't sleep..." },
      { role: 'assistant', content: "I understand, that sounds really tough 😔 Want me to play White Noise to help you relax?" },
    ],
    features: {
      title: 'Powerful', title2: 'features',
      desc: 'Everything you need to manage tinnitus in one platform',
      items: [
        { icon: '💬', title: 'Smart AI Chat', desc: 'Talk to Tinni — your 24/7 AI tinnitus companion with clickable options & tool integration', img: '/landing/ai-chat.png' },
        { icon: '🎧', title: 'Sound Therapy', desc: '11 sounds: White/Pink/Brown noise, ocean waves, rain, forest, campfire + visual animations', img: '/landing/sound-therapy.png' },
        { icon: '👂', title: 'Hearing Test', desc: 'Clinical-grade Hughson-Westlake audiometry at 6 frequencies, right in your browser', img: '/landing/hearing-test.png' },
        { icon: '📋', title: 'Clinical Assessments', desc: '5 validated questionnaires: THI, TFI, ISI, PHQ-9, GAD-7 — with AI-powered analysis', img: '/landing/quiz.png' },
        { icon: '🧘', title: 'Relaxation & Meditation', desc: '4-7-8 breathing, box breathing, progressive muscle relaxation — reduce stress-triggered tinnitus', img: '/landing/relax.png' },
        { icon: '📊', title: 'Progress Tracking', desc: 'Charts for mood, sleep quality, tinnitus severity over time — measure therapy effectiveness', img: '/landing/quiz.png' },
        { icon: '🎛️', title: 'Sound Mixer', desc: 'Layer multiple sounds, adjust per-channel volume — create your personalized therapy mix', img: '/landing/sound-therapy.png' },
        { icon: '🎯', title: 'Notch Therapy', desc: 'Frequency-targeted notch therapy — reduce tinnitus intensity through neuroplasticity', img: '/landing/hearing-test.png' },
        { icon: '🧠', title: 'CBT-i Module', desc: '4-week cognitive behavioral therapy for insomnia — 12 guided exercises with clinical content', img: '/landing/relax.png' },
        { icon: '🌙', title: 'Sleep Mode', desc: 'Sleep timer, auto fade-out, dark screen — designed for bedtime tinnitus masking', img: '/landing/sound-therapy.png' },
        { icon: '🤖', title: 'Tinni Coach', desc: 'AI personal coach — suggests exercises, tracks progress, daily reminders', img: '/landing/ai-chat.png' },
        { icon: '📰', title: 'Knowledge Blog', desc: 'Expert articles on tinnitus, audiology, latest research — regularly updated', img: '/landing/quiz.png' },
      ],
    },
    how: {
      title1: 'How it', title2: 'works',
      steps: [
        { step: '01', title: 'Share', desc: 'Talk to Tinni about your symptoms, feelings, and challenges' },
        { step: '02', title: 'Discover', desc: 'AI analyzes and recommends sound therapy, exercises, and assessments' },
        { step: '03', title: 'Improve', desc: 'Track your progress, adjust therapy, and improve every day' },
      ],
    },
    hearingLoss: {
      title1: 'Tinnitus &', title2: 'Hearing Loss',
      stat: '70%',
      statDesc: 'of tinnitus sufferers have hearing loss',
      desc: 'Research shows that 70% of people with tinnitus have some degree of hearing loss across various frequencies. Early detection enables timely intervention and significantly improves quality of life.',
      facts: [
        '🔬 Tinnitus is often an early sign of hearing damage',
        '📉 Untreated hearing loss can worsen tinnitus',
        '🏥 Regular hearing tests help catch problems early',
        '✅ Early intervention improves 80% of hearing-related tinnitus cases',
      ],
      cta: 'Free Hearing Test',
      ctaSub: 'Test your hearing online at hearingtest.vuinghe.com',
      ctaLink: 'https://hearingtest.vuinghe.com',
    },
    testimonials: {
      title1: 'What users', title2: 'say',
      items: [
        { name: 'Minh Anh', role: 'Office worker, 32', text: 'TinniMate helped me sleep so much better. Ocean waves + 4-7-8 breathing actually works. After 2 months, I barely notice the ringing anymore.', avatar: '/landing/avatars/minh-anh.png', duration: '2 months' },
        { name: 'Nguyen Van Hung', role: 'Retired, age 65', text: '5 years of tinnitus, tried everything. After 3 months with TinniMate, my THI dropped from 56 to 32. My daughter set it up for me — very easy to use.', avatar: '/landing/avatars/bac-hung.png', duration: '3 months' },
        { name: 'Dr. Tran Thu Ha', role: 'ENT Specialist', text: 'I recommend it to my patients for home support. The THI/TFI questionnaires help me track treatment progress remotely — very convenient.', avatar: '/landing/avatars/thu-ha.png', duration: 'Expert' },
        { name: 'Sarah Mitchell', role: 'Teacher, age 28', text: 'I was skeptical about an app helping with my tinnitus, but the sound therapy and AI coaching genuinely changed my sleep quality. Highly recommend!', avatar: '/landing/avatars/sarah.png', duration: '4 months' },
        { name: 'James Robinson', role: 'Retired engineer, age 55', text: 'After trying expensive hearing aids and clinics, TinniMate gave me more relief in 2 months than years of other treatments. The fractal tones are amazing.', avatar: '/landing/avatars/james.png', duration: '2 months' },
        { name: 'Dr. Elena Fischer', role: 'Audiologist, Germany', text: 'As a clinician, I appreciate the evidence-based approach. The Hughson-Westlake audiometry and CBT-i module are properly implemented. A great patient tool.', avatar: '/landing/avatars/dr-lisa.png', duration: 'Expert' },
      ],
    },
    pricing: {
      title1: 'Simple', title2: 'pricing',
      desc: 'Start free, upgrade when you need more',
      popular: 'Most Popular',
      plans: [
        { name: 'Free', price: '$0', period: '/month', features: ['5 messages/day', '3 basic sounds', '1 hearing test/month', '1 questionnaire/month'], cta: 'Start Free' },
        { name: 'Premium', price: '$4.99', period: '/month', features: ['Unlimited chat', 'All 11 sound therapies', 'All 5 questionnaires', 'Progress charts', 'Relaxation exercises', 'Export reports'], cta: 'Upgrade to Premium', highlight: true },
        { name: 'Pro', price: '$9.99', period: '/month', features: ['All Premium features', 'Audiologist consultation', 'Family sharing (3 people)', 'Priority AI responses', 'API access'], cta: 'Upgrade to Pro' },
      ],
    },
    cta: { title: 'Ready to take control?', desc: 'Thousands of people have improved their quality of life with TinniMate. Start your journey today.', btn: 'Start Free →' },
    footer: { tagline: 'TinniMate — Your tinnitus companion', privacy: 'Privacy Policy', terms: 'Terms of Service', contact: 'Contact' },
  },
}

const FEATURE_COLORS = [
  { color: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/20' },
  { color: 'from-violet-500 to-purple-400', glow: 'shadow-violet-500/20' },
  { color: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/20' },
  { color: 'from-amber-500 to-orange-400', glow: 'shadow-amber-500/20' },
  { color: 'from-pink-500 to-rose-400', glow: 'shadow-pink-500/20' },
  { color: 'from-indigo-500 to-blue-400', glow: 'shadow-indigo-500/20' },
  { color: 'from-cyan-500 to-sky-400', glow: 'shadow-cyan-500/20' },
  { color: 'from-red-500 to-pink-400', glow: 'shadow-red-500/20' },
  { color: 'from-fuchsia-500 to-purple-400', glow: 'shadow-fuchsia-500/20' },
  { color: 'from-slate-400 to-blue-400', glow: 'shadow-slate-400/20' },
  { color: 'from-teal-500 to-emerald-400', glow: 'shadow-teal-500/20' },
  { color: 'from-orange-500 to-amber-400', glow: 'shadow-orange-500/20' },
]

/* ── Scroll animation hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal()
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export default function LandingPage() {
  const { lang, toggle: toggleLang } = useLangStore()
  const lt = T[lang]

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-hidden">
      {/* SEO Meta would go in layout.tsx / metadata */}

      {/* ── Animated background orbs ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-emerald-600/10 blur-[100px] animate-pulse [animation-delay:4s]" />
        <div className="absolute top-[60%] left-[10%] w-[300px] h-[300px] rounded-full bg-pink-600/10 blur-[100px] animate-pulse [animation-delay:3s]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#020617]/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/landing/logo.png" alt="TinniMate" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-lg text-white">TinniMate</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">{lt.nav.features}</a>
            <a href="#how" className="hover:text-white transition-colors">{lt.nav.how}</a>
            <a href="#testimonials" className="hover:text-white transition-colors">{lt.nav.testimonials}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{lt.nav.pricing}</a>
          </div>
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <button onClick={toggleLang}
              className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-full text-slate-400 hover:text-white hover:border-white/25 transition-all">
              {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VI'}
            </button>
            <Link href="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors hidden sm:block">
              {lt.nav.login}
            </Link>
            <Link href="/signup" className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/25">
              {lt.nav.cta}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          <RevealSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {lt.hero.badge}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-white via-blue-100 to-violet-200 bg-clip-text text-transparent">
                {lt.hero.title1}
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                {lt.hero.title2}
              </span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-md leading-relaxed">{lt.hero.desc}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/chat" className="group flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full font-medium transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
                {lang === 'vi' ? '💬 Tư vấn miễn phí với Tinni' : '💬 Free Consultation with Tinni'}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link href="/signup" className="px-6 py-3.5 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white rounded-full text-sm transition-all hover:bg-white/5">
                {lt.hero.cta1}
              </Link>
              <a href="#features" className="px-6 py-3.5 text-slate-500 hover:text-white text-sm transition-all">
                {lt.hero.cta2}
              </a>
            </div>
            {/* Online 24/7 badge */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-emerald-400 text-xs font-medium">
                  {lang === 'vi' ? 'Tinni đang online 24/7' : 'Tinni is online 24/7'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/5">
              {[
                { value: '10K+', label: lt.hero.stat1 },
                { value: '50K+', label: lt.hero.stat2 },
                { value: '4.8★', label: lt.hero.stat3 },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {/* Evidence-based badges */}
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                <span>🔬</span> {lt.hero.evidence}
              </div>
              {lt.hero.evidenceItems.map((item: string) => (
                <span key={item} className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[9px] text-slate-500">
                  ✓ {item}
                </span>
              ))}
            </div>
          </RevealSection>

          {/* Hero image + Chat preview */}
          <RevealSection delay={200}>
            <div className="relative">
              {/* Hero image background */}
              <div className="absolute -inset-6 rounded-3xl overflow-hidden opacity-40">
                <Image src="/landing/hero.png" alt="Tinnitus relief" fill className="object-cover blur-sm" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 via-violet-500/10 to-transparent blur-2xl rounded-3xl" />
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-slate-500">{lt.chat.title}</span>
                </div>
                <div className="space-y-4">
                  {lt.chatMsgs.map((msg, i) => (
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
                <div className="mt-3 ml-9 bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-green-400 text-xs font-medium">🎧 {lt.chat.playing}</div>
                  <div className="mt-2 w-full bg-white/5 rounded-full h-1">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-1 rounded-full w-[35%]" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-5 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5">
                  <span className="text-slate-500 text-sm flex-1">{lt.chat.input}</span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center text-xs">↑</div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Testimonials — right after hero for social proof ── */}
      <section id="testimonials" className="py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <RevealSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {lt.testimonials.title1} <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">{lt.testimonials.title2}</span>
              </h2>
            </div>
          </RevealSection>
          {/* Mobile: auto-scroll horizontal */}
          <div className="flex md:hidden gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
            {lt.testimonials.items.map((r: any) => (
              <div key={r.name} className="flex-none w-[85vw] snap-center bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Image src={r.avatar} alt={r.name} width={48} height={48} className="rounded-full object-cover w-12 h-12" />
                  <div>
                    <p className="text-sm font-medium text-white">{r.name}</p>
                    <p className="text-[10px] text-slate-500">{r.role}</p>
                  </div>
                  <div className="ml-auto">
                    <div className="text-yellow-400 text-[10px]">★★★★★</div>
                    <div className="text-[8px] text-slate-600 text-right">{r.duration}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{r.text}&rdquo;</p>
              </div>
            ))}
          </div>
          {/* Desktop: 3-column grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {lt.testimonials.items.slice(0, 6).map((r: any, i: number) => (
              <RevealSection key={r.name} delay={i * 100}>
                <div className="bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Image src={r.avatar} alt={r.name} width={48} height={48} className="rounded-full object-cover w-12 h-12" />
                    <div>
                      <p className="text-sm font-medium text-white">{r.name}</p>
                      <p className="text-[10px] text-slate-500">{r.role}</p>
                    </div>
                    <div className="ml-auto">
                      <div className="text-yellow-400 text-xs">★★★★★</div>
                      <div className="text-[8px] text-slate-600 text-right">{r.duration}</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed italic">&ldquo;{r.text}&rdquo;</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features with images ── */}
      <section id="features" className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <RevealSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{lt.features.title}</span> {lt.features.title2}
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto">{lt.features.desc}</p>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lt.features.items.map((f, i) => (
              <RevealSection key={f.title} delay={i * 100}>
                <div className={`group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${FEATURE_COLORS[i]?.glow}`}>
                  {/* Feature image */}
                  <div className="relative h-36 overflow-hidden">
                    <Image src={f.img} alt={f.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent" />
                    <div className={`absolute top-3 left-3 w-10 h-10 rounded-xl bg-gradient-to-br ${FEATURE_COLORS[i]?.color} flex items-center justify-center text-lg shadow-lg ${FEATURE_COLORS[i]?.glow}`}>
                      {f.icon}
                    </div>
                  </div>
                  <div className="p-4 pt-2">
                    <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <RevealSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {lt.how.title1} <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{lt.how.title2}</span>
              </h2>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-8">
            {lt.how.steps.map((s, i) => (
              <RevealSection key={s.step} delay={i * 150}>
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${['from-blue-500 to-cyan-400', 'from-violet-500 to-purple-400', 'from-emerald-500 to-teal-400'][i]} flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-lg`}>
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-white text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400">{s.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tinnitus & Hearing Loss ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <RevealSection>
            <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-amber-500/5">
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full" />
              
              <div className="relative p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
                {/* Left — stat + description */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6">
                    {lt.hearingLoss.title1}{' '}
                    <span className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">{lt.hearingLoss.title2}</span>
                  </h2>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-6xl md:text-7xl font-black bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                      {lt.hearingLoss.stat}
                    </span>
                    <span className="text-lg text-slate-300 font-medium max-w-[200px] leading-tight">
                      {lt.hearingLoss.statDesc}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">{lt.hearingLoss.desc}</p>
                  <a href={lt.hearingLoss.ctaLink} target="_blank" rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-full font-medium transition-all hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5">
                    👂 {lt.hearingLoss.cta}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                  <p className="text-[11px] text-slate-500 mt-2">{lt.hearingLoss.ctaSub}</p>
                </div>

                {/* Right — fact cards */}
                <div className="space-y-3">
                  {lt.hearingLoss.facts.map((fact: string, i: number) => (
                    <RevealSection key={i} delay={i * 100}>
                      <div className="flex items-start gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 hover:bg-white/[0.06] hover:border-white/10 transition-all">
                        <span className="text-lg">{fact.slice(0, 2)}</span>
                        <span className="text-sm text-slate-300">{fact.slice(3)}</span>
                      </div>
                    </RevealSection>
                  ))}
                  {/* Hearing test image */}
                  <RevealSection delay={500}>
                    <div className="relative h-32 rounded-xl overflow-hidden mt-2">
                      <Image src="/landing/hearing-test.png" alt="Hearing Test" fill className="object-cover opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 text-xs text-slate-300 font-medium">
                        🎧 hearingtest.vuinghe.com
                      </div>
                    </div>
                  </RevealSection>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>


      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <RevealSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{lt.pricing.title1}</span> {lt.pricing.title2}
              </h2>
              <p className="text-slate-400">{lt.pricing.desc}</p>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-6">
            {lt.pricing.plans.map((p, i) => (
              <RevealSection key={p.name} delay={i * 100}>
                <div className={`relative rounded-2xl p-6 transition-all duration-300 ${
                  p.highlight
                    ? 'bg-gradient-to-b from-blue-500/10 to-violet-500/5 border-2 border-blue-500/30 shadow-xl shadow-blue-500/10'
                    : 'bg-white/[0.02] border border-white/5 hover:border-white/10'
                }`}>
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full text-xs font-medium text-white">
                      {lt.pricing.popular}
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
                  <Link href="/signup"
                    className={`w-full flex items-center justify-center py-3 rounded-xl font-medium text-sm transition-all ${
                      p.highlight
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
                    }`}>
                    {p.cta}
                  </Link>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-6">
        <RevealSection>
          <div className="mx-auto max-w-3xl text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-pink-600/20 blur-3xl rounded-full" />
              <div className="relative bg-white/[0.02] backdrop-blur border border-white/5 rounded-3xl p-12">
                <h2 className="text-3xl font-bold mb-4">{lt.cta.title}</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">{lt.cta.desc}</p>
                <Link href="/signup" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full font-medium text-lg transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
                  {lt.cta.btn}
                </Link>
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">T</div>
            {lt.footer.tagline}
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <a href="#" className="hover:text-slate-400 transition-colors">{lt.footer.privacy}</a>
            <a href="#" className="hover:text-slate-400 transition-colors">{lt.footer.terms}</a>
            <a href="#" className="hover:text-slate-400 transition-colors">{lt.footer.contact}</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
