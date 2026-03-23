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
      title: 'Công cụ', title2: 'chuyên biệt',
      desc: 'Nền tảng toàn diện được xây dựng trên nghiên cứu lâm sàng — giúp bạn hiểu, kiểm soát và cải thiện tình trạng ù tai mỗi ngày',
      items: [
        {
          icon: '📋', title: 'Chẩn đoán lâm sàng',
          subtitle: 'Bộ câu hỏi chuẩn quốc tế',
          desc: 'Đánh giá mức độ ù tai và tác động tâm lý bằng 5 thang đo được WHO công nhận. AI phân tích kết quả và đề xuất liệu trình cá nhân hóa.',
          tags: ['THI', 'TFI', 'ISI', 'PHQ-9', 'GAD-7'],
          img: '/landing/features/diagnostic.png',
          accent: 'from-violet-600/80 to-purple-800/60', glow: 'violet',
          exclusive: false,
        },
        {
          icon: '🧠', title: 'Quản lý tiếng ù',
          subtitle: 'CBT · Âm thanh · Thư giãn',
          desc: 'Kết hợp liệu pháp hành vi nhận thức CBT-i, 11 âm thanh trị liệu và bài tập thư giãn tinh thần để giảm ảnh hưởng của ù tai lên cuộc sống.',
          tags: ['CBT-i', 'White Noise', '4-7-8', 'Sound Mixer', 'Sleep Mode'],
          img: '/landing/features/management.png',
          accent: 'from-emerald-600/80 to-teal-800/60', glow: 'emerald',
          exclusive: false,
        },
        {
          icon: '✨', title: 'Zentone',
          subtitle: 'Phương pháp âm thanh độc quyền',
          desc: 'Công nghệ âm thanh fractal độc quyền của TinniMate — điều chỉnh theo tần số ù tai của từng người, kích thích neuroplasticity để giảm cường độ tiếng ù.',
          tags: ['Fractal Audio', 'Personalized', 'Neuroplasticity'],
          img: '/landing/features/zentone.png',
          accent: 'from-amber-600/80 to-orange-800/60', glow: 'amber',
          exclusive: true,
        },
        {
          icon: '🎯', title: 'Notch Therapy',
          subtitle: 'Lọc âm tần số chính xác',
          desc: 'Lọc chính xác tần số gây ù tai khỏi nguồn âm thanh, ức chế hoạt động thần kinh liên quan và giảm dần cường độ tiếng ù theo thời gian.',
          tags: ['Frequency Filter', 'Neural Inhibition', 'Clinical Grade'],
          img: '/landing/features/notch.png',
          accent: 'from-red-600/80 to-rose-800/60', glow: 'red',
          exclusive: true,
        },
        {
          icon: '👂', title: 'Tiện ích thính giác',
          subtitle: 'Đo thính lực & theo dõi',
          desc: 'Kiểm tra sức nghe bằng phương pháp Hughson-Westlake chuẩn lâm sàng tại 6 tần số, theo dõi tiến triển bằng biểu đồ audiogram cá nhân hóa.',
          tags: ['Audiometry', 'Hughson-Westlake', '6 Frequencies', 'Progress Chart'],
          img: '/landing/features/hearing.png',
          accent: 'from-cyan-600/80 to-blue-800/60', glow: 'cyan',
          exclusive: false,
        },
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
      title: 'Specialized', title2: 'tools',
      desc: 'A comprehensive platform built on clinical research — helping you understand, manage and improve tinnitus every day',
      items: [
        {
          icon: '📋', title: 'Clinical Diagnostics',
          subtitle: 'International standard questionnaires',
          desc: 'Assess tinnitus severity and psychological impact with 5 WHO-recognized scales. AI analyzes results and recommends a personalized therapy plan.',
          tags: ['THI', 'TFI', 'ISI', 'PHQ-9', 'GAD-7'],
          img: '/landing/features/diagnostic.png',
          accent: 'from-violet-600/80 to-purple-800/60', glow: 'violet',
          exclusive: false,
        },
        {
          icon: '🧠', title: 'Tinnitus Management',
          subtitle: 'CBT · Sound Therapy · Relaxation',
          desc: 'Combines CBT-i, 11 sound therapies and relaxation exercises to reduce the impact of tinnitus on daily life.',
          tags: ['CBT-i', 'White Noise', '4-7-8', 'Sound Mixer', 'Sleep Mode'],
          img: '/landing/features/management.png',
          accent: 'from-emerald-600/80 to-teal-800/60', glow: 'emerald',
          exclusive: false,
        },
        {
          icon: '✨', title: 'Zentone',
          subtitle: 'Proprietary sound method',
          desc: 'TinniMate\'s exclusive fractal audio technology — tuned to each person\'s tinnitus frequency, stimulating neuroplasticity to reduce tinnitus intensity.',
          tags: ['Fractal Audio', 'Personalized', 'Neuroplasticity'],
          img: '/landing/features/zentone.png',
          accent: 'from-amber-600/80 to-orange-800/60', glow: 'amber',
          exclusive: true,
        },
        {
          icon: '🎯', title: 'Notch Therapy',
          subtitle: 'Precision frequency filtering',
          desc: 'Precisely filters the tinnitus-causing frequency from audio sources, suppressing related neural activity and gradually reducing tinnitus intensity.',
          tags: ['Frequency Filter', 'Neural Inhibition', 'Clinical Grade'],
          img: '/landing/features/notch.png',
          accent: 'from-red-600/80 to-rose-800/60', glow: 'red',
          exclusive: true,
        },
        {
          icon: '👂', title: 'Hearing Utilities',
          subtitle: 'Audiometry & tracking',
          desc: 'Test your hearing with clinical-grade Hughson-Westlake audiometry at 6 frequencies, and track progress with a personalized audiogram.',
          tags: ['Audiometry', 'Hughson-Westlake', '6 Frequencies', 'Progress Chart'],
          img: '/landing/features/hearing.png',
          accent: 'from-cyan-600/80 to-blue-800/60', glow: 'cyan',
          exclusive: false,
        },
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



/* ── Scroll animation hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Fallback: force visible after 300ms in case IntersectionObserver fails (WKWebView quirk)
    const fallback = setTimeout(() => setVisible(true), 300)
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); clearTimeout(fallback); obs.disconnect() } },
      { threshold: 0 } // threshold:0 fires as soon as any pixel is visible
    )
    obs.observe(el)
    return () => { obs.disconnect(); clearTimeout(fallback) }
  }, [])
  return { ref, visible }
}

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'} ${className}`}
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

      {/* ── Ambient Background: Aurora clouds ── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[140px] animate-pulse" />
        <div className="absolute top-[25%] right-[-15%] w-[600px] h-[600px] rounded-full bg-violet-600/12 blur-[130px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-[-10%] left-[25%] w-[500px] h-[500px] rounded-full bg-cyan-600/8 blur-[120px] animate-pulse [animation-delay:4s]" />
        <div className="absolute top-[55%] left-[5%] w-[350px] h-[350px] rounded-full bg-fuchsia-600/8 blur-[100px] animate-pulse [animation-delay:3s]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#020617]/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            {/* Aurora Orb Logo Mark */}
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="aurora-orb-glow absolute inset-0 rounded-full bg-indigo-500/50 blur-md" />
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-lg shadow-indigo-500/30">
                <div className="aurora-orb-blob absolute inset-[-30%] rounded-full"
                  style={{ background: 'conic-gradient(from 0deg, #4f46e5, #7c3aed, #06b6d4, #ec4899, #4f46e5)' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full" />
              </div>
            </div>
            <span className="font-bold text-lg text-white tracking-wide">Tinnimate</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">{lt.nav.features}</a>
            <a href="#how" className="hover:text-white transition-colors">{lt.nav.how}</a>
            <a href="#testimonials" className="hover:text-white transition-colors">{lt.nav.testimonials}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{lt.nav.pricing}</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang}
              className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-full text-slate-400 hover:text-white hover:border-white/25 transition-all">
              {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VI'}
            </button>
            <Link href="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors hidden sm:block">
              {lt.nav.login}
            </Link>
            <Link href="/signup" className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full transition-all hover:shadow-lg hover:shadow-indigo-500/30">
              {lt.nav.cta}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 items-center">
          <RevealSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {lt.hero.badge}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-100 bg-clip-text text-transparent">
                {lt.hero.title1}
              </span>
              <br />
              <span className="text-shimmer">
                {lt.hero.title2}
              </span>
            </h1>
            <p className="text-lg text-slate-400 mb-8 max-w-md leading-relaxed">{lt.hero.desc}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/chat" className="group flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full font-medium transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5">
                {lang === 'vi' ? '💬 Tư vấn miễn phí với Tinni' : '💬 Free Consultation with Tinni'}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link href="/signup" className="px-6 py-3.5 border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white rounded-full text-sm transition-all hover:bg-indigo-500/5">
                {lt.hero.cta1}
              </Link>
            </div>
            {/* Online badge */}
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
            {/* Stats */}
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
          </RevealSection>

          {/* ── Heroes: Aurora Orb + Chat Card ── */}
          <RevealSection delay={200}>
            <div className="relative flex items-center justify-center h-[480px]">

              {/* Big Aurora Orb — floats */}
              <div className="aurora-float relative z-10">
                {/* Outer glow halo */}
                <div className="aurora-orb-glow absolute inset-[-20%] rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.2) 50%, transparent 70%)' }} />
                {/* Glass sphere */}
                <div className="relative w-64 h-64 rounded-full overflow-hidden border border-white/20 shadow-2xl shadow-indigo-500/30">
                  {/* Animated blob inside */}
                  <div className="aurora-orb-blob absolute inset-[-40%] rounded-full"
                    style={{ background: 'conic-gradient(from 0deg, #312e81, #4f46e5, #7c3aed, #06b6d4, #ec4899, #7c3aed, #312e81)' }} />
                  {/* Blur overlay for smooth look */}
                  <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(15,23,42,0.15)' }} />
                  {/* Glass shine highlight */}
                  <div className="absolute top-[8%] left-[12%] w-[45%] h-[30%] rounded-full"
                    style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 70%)', transform: 'rotate(-20deg)' }} />
                </div>
              </div>

              {/* Chat preview card — glassmorphism, overlapping bottom-left */}
              <div className="absolute bottom-4 left-0 w-80 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl z-20">
                <div className="flex items-center gap-2 mb-4">
                  {/* Mini orb avatar */}
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                    <div className="aurora-orb-blob absolute inset-[-40%] rounded-full"
                      style={{ background: 'conic-gradient(from 0deg, #4f46e5, #06b6d4, #7c3aed, #4f46e5)' }} />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{lt.chat.title}</span>
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-3">
                  {lt.chatMsgs.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                      {msg.role === 'assistant' && (
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/15 flex-shrink-0">
                          <div className="aurora-orb-blob absolute inset-[-40%] rounded-full"
                            style={{ background: 'conic-gradient(from 0deg, #4f46e5, #06b6d4, #4f46e5)' }} />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                          : 'bg-white/[0.06] text-slate-200 border border-white/5'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2">
                  <span className="text-slate-500 text-[11px] flex-1">{lt.chat.input}</span>
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-[10px] text-white">↑</div>
                </div>
              </div>

              {/* Floating mini badge — top right */}
              <div className="absolute top-8 right-0 bg-white/[0.05] backdrop-blur border border-white/10 rounded-xl px-4 py-3 z-20">
                <div className="text-xs text-slate-400 mb-1">🎧 {lt.chat.playing}</div>
                <div className="w-full bg-white/5 rounded-full h-1">
                  <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1 rounded-full w-[35%]" />
                </div>
              </div>

            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Testimonials — Premium Bento Grid ── */}
      <section id="testimonials" className="py-20 px-6 overflow-hidden">
        <div className="mx-auto max-w-6xl">
          <RevealSection>
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                {lang === 'vi' ? '10,000+ người dùng tin tưởng' : '10,000+ people trust TinniMate'}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {lt.testimonials.title1}{' '}
                <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                  {lt.testimonials.title2}
                </span>
              </h2>
              <p className="text-slate-400 max-w-md mx-auto text-sm">
                {lang === 'vi'
                  ? 'Những câu chuyện có thật từ người dùng đang cải thiện cuộc sống mỗi ngày'
                  : 'Real stories from people improving their lives every day'}
              </p>
            </div>
          </RevealSection>

          {/* ── FEATURED HERO TESTIMONIAL ── */}
          <RevealSection delay={100}>
            <div className="relative rounded-3xl overflow-hidden mb-6 group cursor-default">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/12 via-rose-600/8 to-violet-600/10" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 blur-[80px] rounded-full" />
              {/* Border with shimmer */}
              <div className="absolute inset-0 rounded-3xl border border-pink-500/20 group-hover:border-pink-500/35 transition-colors duration-500" />

              <div className="relative p-8 md:p-12">
                {/* Giant quote mark */}
                <div className="absolute top-4 left-8 text-[120px] leading-none font-serif text-pink-500/10 select-none pointer-events-none">&ldquo;</div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Left: Avatar + info */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-3">
                    {/* Avatar with animated ring */}
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-[-3px] rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 animate-spin" style={{ animationDuration: '4s' }} />
                      <div className="absolute inset-[-2px] rounded-full bg-[#020617]" />
                      <img src={lt.testimonials.items[0].avatar} alt={lt.testimonials.items[0].name} className="relative w-20 h-20 rounded-full object-cover" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold">{lt.testimonials.items[0].name}</p>
                      <p className="text-xs text-slate-500">{lt.testimonials.items[0].role}</p>
                    </div>
                    {/* Metric badge */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
                        ✓ {lt.testimonials.items[0].duration}
                      </div>
                      <div className="flex gap-0.5 text-yellow-400 text-sm">★★★★★</div>
                    </div>
                  </div>

                  {/* Right: Big quote */}
                  <div className="flex-1">
                    <p className="text-lg md:text-xl text-slate-100 leading-relaxed font-light italic relative z-10">
                      &ldquo;{lt.testimonials.items[0].text}&rdquo;
                    </p>
                    {/* THI metric pill for Hung (index 1 in vi) */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                        <span className="text-pink-400">🎧</span>
                        {lang === 'vi' ? 'Cải thiện giấc ngủ' : 'Improved sleep quality'}
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                        <span className="text-emerald-400">📉</span>
                        {lang === 'vi' ? 'Giảm triệu chứng ù tai' : 'Reduced tinnitus symptoms'}
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                        <span className="text-blue-400">🧘</span>
                        {lang === 'vi' ? 'Hít thở 4-7-8' : '4-7-8 breathing'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>

          {/* ── BENTO GRID — items 1-5 ── */}
          <div className="hidden md:grid grid-cols-3 gap-4">
            {/* Card 1 — span 1 (tall, with THI metric) */}
            <RevealSection delay={150}>
              <div className="relative group rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-violet-500/10 h-full flex flex-col p-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/8 blur-3xl rounded-full" />
                {/* THI drop metric — big visual */}
                <div className="relative mb-4 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/15">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">THI Score</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-white">56</span>
                        <span className="text-violet-400 text-lg">→</span>
                        <span className="text-3xl font-black text-emerald-400">32</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-400">-43%</div>
                      <div className="text-[10px] text-slate-500">3 tháng</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 mb-3">
                  <img src={lt.testimonials.items[1].avatar} alt={lt.testimonials.items[1].name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-violet-500/40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lt.testimonials.items[1].name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{lt.testimonials.items[1].role}</p>
                  </div>
                  <div className="text-yellow-400 text-[10px]">★★★★★</div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic flex-1">&ldquo;{lt.testimonials.items[1].text}&rdquo;</p>
                <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] self-start">
                  ⏱ {lt.testimonials.items[1].duration}
                </div>
              </div>
            </RevealSection>

            {/* Card 2 — Doctor/Expert (span 1, horizon accent) */}
            <RevealSection delay={200}>
              <div className="relative group rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-cyan-500/10 h-full flex flex-col p-6">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 opacity-60" />
                <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/8 blur-3xl rounded-full" />
                {/* Expert badge */}
                <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs self-start">
                  🏥 {lang === 'vi' ? 'Bác sĩ chuyên khoa' : 'Medical Expert'}
                </div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="absolute inset-[-1.5px] rounded-full bg-gradient-to-r from-cyan-400 to-teal-400" />
                    <div className="absolute inset-[-0.5px] rounded-full bg-[#020617]" />
                    <img src={lt.testimonials.items[2].avatar} alt={lt.testimonials.items[2].name} className="relative w-10 h-10 rounded-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lt.testimonials.items[2].name}</p>
                    <p className="text-[10px] text-cyan-400/70 truncate">{lt.testimonials.items[2].role}</p>
                  </div>
                  <div className="text-yellow-400 text-[10px]">★★★★★</div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic flex-1">&ldquo;{lt.testimonials.items[2].text}&rdquo;</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 border border-white/5">THI ✓</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 border border-white/5">TFI ✓</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 border border-white/5">Remotely</span>
                </div>
              </div>
            </RevealSection>

            {/* Card 3 — Sarah (skeptic → convert, span 1) */}
            <RevealSection delay={250}>
              <div className="relative group rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-500/10 h-full flex flex-col p-6">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/8 blur-3xl rounded-full" />
                {/* Pre/post label */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[10px] text-amber-400/70 font-medium px-2">
                    {lang === 'vi' ? '4 tháng sử dụng' : '4 months journey'}
                  </span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="flex items-center gap-2.5 mb-3">
                  <img src={lt.testimonials.items[3].avatar} alt={lt.testimonials.items[3].name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-amber-500/40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lt.testimonials.items[3].name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{lt.testimonials.items[3].role}</p>
                  </div>
                  <div className="text-yellow-400 text-[10px]">★★★★★</div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic flex-1">&ldquo;{lt.testimonials.items[3].text}&rdquo;</p>
                <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] self-start">
                  💤 {lang === 'vi' ? 'Chất lượng ngủ +80%' : 'Sleep quality +80%'}
                </div>
              </div>
            </RevealSection>

            {/* Card 4 — James (span 2, wide with quote pullout) */}
            <RevealSection delay={300}>
              <div className="relative group col-span-2 rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 p-6">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/8 blur-3xl rounded-full" />
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <img src={lt.testimonials.items[4].avatar} alt={lt.testimonials.items[4].name} className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/40" />
                    <div className="text-center">
                      <p className="text-xs font-medium text-white">{lt.testimonials.items[4].name}</p>
                      <p className="text-[9px] text-slate-500">{lt.testimonials.items[4].role}</p>
                    </div>
                    <div className="flex gap-0.5 text-yellow-400 text-[10px]">★★★★★</div>
                    <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[9px]">
                      {lt.testimonials.items[4].duration}
                    </div>
                  </div>
                  <div className="flex-1">
                    {/* Pull-quote highlight */}
                    <div className="mb-3 p-3 rounded-xl border-l-2 border-blue-400/50 bg-blue-500/5">
                      <p className="text-sm text-blue-100 font-medium italic">
                        &ldquo;{lang === 'vi' ? 'Hiệu quả hơn nhiều năm điều trị khác' : 'More relief in 2 months than years of other treatments'}&rdquo;
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{lt.testimonials.items[4].text}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-[10px] text-slate-400">🎵 Fractal Tones</span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-[10px] text-slate-400">🏥 vs. Clinics</span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-[10px] text-emerald-400">✓ Highly Effective</span>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Card 5 — Dr. Elena (span 1, clinical) */}
            <RevealSection delay={350}>
              <div className="relative group rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-teal-500/30 transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/10 h-full flex flex-col p-6">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500 opacity-60" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-teal-500/8 blur-3xl rounded-full" />
                <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs self-start">
                  🎓 {lang === 'vi' ? 'Chuyên gia thính học' : 'Audiologist'}
                </div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="absolute inset-[-1.5px] rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" />
                    <div className="absolute inset-[-0.5px] rounded-full bg-[#020617]" />
                    <img src={lt.testimonials.items[5].avatar} alt={lt.testimonials.items[5].name} className="relative w-10 h-10 rounded-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lt.testimonials.items[5].name}</p>
                    <p className="text-[10px] text-teal-400/70 truncate">{lt.testimonials.items[5].role}</p>
                  </div>
                  <div className="text-yellow-400 text-[10px]">★★★★★</div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic flex-1">&ldquo;{lt.testimonials.items[5].text}&rdquo;</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 border border-white/5">HW Audiometry ✓</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 border border-white/5">CBT-i ✓</span>
                </div>
              </div>
            </RevealSection>
          </div>

          {/* ── MOBILE: Marquee scroll ── */}
          <div className="md:hidden -mx-6 px-0 overflow-hidden">
            {/* First row */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 px-6 scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
              {lt.testimonials.items.map((r: any, i: number) => {
                const CARD_COLORS = [
                  { ring: 'from-pink-500 to-rose-400', badge: 'bg-pink-500/10 border-pink-500/20 text-pink-300' },
                  { ring: 'from-violet-500 to-purple-400', badge: 'bg-violet-500/10 border-violet-500/20 text-violet-300' },
                  { ring: 'from-cyan-500 to-teal-400', badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300' },
                  { ring: 'from-amber-500 to-orange-400', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-300' },
                  { ring: 'from-blue-500 to-indigo-400', badge: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
                  { ring: 'from-teal-500 to-cyan-400', badge: 'bg-teal-500/10 border-teal-500/20 text-teal-300' },
                ][i] ?? { ring: 'from-indigo-500 to-violet-400', badge: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' }
                return (
                  <div key={r.name} className="flex-none w-[78vw] snap-center bg-white/[0.03] border border-white/8 rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 flex-shrink-0">
                        <div className={`absolute inset-[-2px] rounded-full bg-gradient-to-br ${CARD_COLORS.ring}`} />
                        <div className="absolute inset-[-1px] rounded-full bg-[#020617]" />
                        <img src={r.avatar} alt={r.name} className="relative w-11 h-11 rounded-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{r.role}</p>
                      </div>
                      <div className="text-yellow-400 text-xs flex flex-col items-end gap-0.5">
                        <span>★★★★★</span>
                        <span className="text-[9px] text-slate-600">{r.duration}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{r.text}&rdquo;</p>
                    <div className={`self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-medium ${CARD_COLORS.badge}`}>
                      ✓ {r.duration}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Social proof bar ── */}
          <RevealSection delay={400}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 py-6 border-t border-white/5">
              {[
                { value: '4.8★', label: lang === 'vi' ? 'Đánh giá trung bình' : 'Average rating', color: 'text-yellow-400' },
                { value: '10K+', label: lang === 'vi' ? 'Người dùng tin tưởng' : 'Trusted users', color: 'text-pink-400' },
                { value: '89%', label: lang === 'vi' ? 'Cải thiện sau 3 tháng' : 'Improved in 3 months', color: 'text-emerald-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <RevealSection>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                {lang === 'vi' ? 'Nền tảng lâm sàng toàn diện' : 'Comprehensive clinical platform'}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="text-shimmer">{lt.features.title}</span>{' '}
                <span className="text-white">{lt.features.title2}</span>
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">{lt.features.desc}</p>
            </div>
          </RevealSection>

          {/* ── Row 1: 2-col hero + 2-row stack ── */}
          <div className="grid lg:grid-cols-5 gap-4 mb-4">

            {/* Zentone — hero tall card (col-span-2) */}
            <RevealSection delay={0} className="lg:col-span-2">
              <div className="group relative rounded-3xl overflow-hidden h-full min-h-[420px] cursor-default">
                {/* BG image */}
                <img src={lt.features.items[2].img} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {/* gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${lt.features.items[2].accent} via-black/50 to-transparent`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                {/* Exclusive pill */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-semibold backdrop-blur-sm">
                  ⚡ {lang === 'vi' ? 'Độc quyền' : 'Exclusive'}
                </div>
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-3xl mb-2">{lt.features.items[2].icon}</div>
                  <h3 className="text-2xl font-black text-white mb-1">{lt.features.items[2].title}</h3>
                  <p className="text-amber-300/80 text-xs font-medium mb-3">{lt.features.items[2].subtitle}</p>
                  <p className="text-sm text-white/70 leading-relaxed mb-4">{lt.features.items[2].desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lt.features.items[2].tags.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[10px] text-white/80 backdrop-blur-sm">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Right 2-row stack: Diagnostic + Management */}
            <div className="lg:col-span-3 grid grid-rows-2 gap-4">
              {/* Diagnostic */}
              <RevealSection delay={100}>
                <div className="group relative rounded-3xl overflow-hidden min-h-[200px]">
                  <img src={lt.features.items[0].img} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-900/85 via-black/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="relative p-6 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-2xl">{lt.features.items[0].icon}</span>
                        <h3 className="text-xl font-bold text-white mt-1">{lt.features.items[0].title}</h3>
                        <p className="text-violet-300 text-xs mt-0.5">{lt.features.items[0].subtitle}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                        {lt.features.items[0].tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded-md bg-violet-500/20 border border-violet-400/20 text-violet-300 text-[9px]">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-white/65 leading-relaxed mt-3 max-w-[70%]">{lt.features.items[0].desc}</p>
                  </div>
                </div>
              </RevealSection>
              {/* Management */}
              <RevealSection delay={150}>
                <div className="group relative rounded-3xl overflow-hidden min-h-[200px]">
                  <img src={lt.features.items[1].img} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-black/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="relative p-6 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-2xl">{lt.features.items[1].icon}</span>
                        <h3 className="text-xl font-bold text-white mt-1">{lt.features.items[1].title}</h3>
                        <p className="text-emerald-300 text-xs mt-0.5">{lt.features.items[1].subtitle}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                        {lt.features.items[1].tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/20 text-emerald-300 text-[9px]">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-white/65 leading-relaxed mt-3 max-w-[70%]">{lt.features.items[1].desc}</p>
                  </div>
                </div>
              </RevealSection>
            </div>
          </div>

          {/* ── Row 2: Notch + Hearing — equal 2-col ── */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Notch Therapy */}
            <RevealSection delay={200}>
              <div className="group relative rounded-3xl overflow-hidden min-h-[260px]">
                <img src={lt.features.items[3].img} alt="" className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                {/* Exclusive badge */}
                <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/25 border border-red-400/40 text-red-300 text-[11px] font-semibold backdrop-blur-sm">
                  🔒 {lang === 'vi' ? 'Độc quyền' : 'Exclusive'}
                </div>
                <div className="relative p-6 h-full flex flex-col justify-end">
                  <div className="text-2xl mb-1">{lt.features.items[3].icon}</div>
                  <h3 className="text-xl font-bold text-white">{lt.features.items[3].title}</h3>
                  <p className="text-red-300 text-xs mb-2">{lt.features.items[3].subtitle}</p>
                  <p className="text-sm text-white/65 leading-relaxed mb-3">{lt.features.items[3].desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lt.features.items[3].tags.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[10px] text-white/80 backdrop-blur-sm">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Hearing Utilities */}
            <RevealSection delay={250}>
              <div className="group relative rounded-3xl overflow-hidden min-h-[260px]">
                <img src={lt.features.items[4].img} alt="" className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/90 via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                <div className="relative p-6 h-full flex flex-col justify-end">
                  <div className="text-2xl mb-1">{lt.features.items[4].icon}</div>
                  <h3 className="text-xl font-bold text-white">{lt.features.items[4].title}</h3>
                  <p className="text-cyan-300 text-xs mb-2">{lt.features.items[4].subtitle}</p>
                  <p className="text-sm text-white/65 leading-relaxed mb-3">{lt.features.items[4].desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lt.features.items[4].tags.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-[10px] text-white/80 backdrop-blur-sm">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </RevealSection>
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
                  <RevealSection delay={500}>
                    <div className="relative h-32 rounded-xl overflow-hidden mt-2 flex items-center justify-center"
                      style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.15) 0%, rgba(2,6,23,0.95) 100%)' }}>
                      {/* Audiogram bars visualization */}
                      <div className="flex items-end gap-2 h-16">
                        {[60, 45, 72, 55, 80, 40].map((h, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1">
                            <div className="w-3 rounded-t-sm bg-gradient-to-t from-blue-600 to-cyan-400 opacity-80"
                              style={{ height: `${h}%` }} />
                            <span className="text-[7px] text-slate-600">{['250','500','1k','2k','4k','8k'][idx]}</span>
                          </div>
                        ))}
                      </div>
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
