'use client'

import { useLangStore } from '@/stores/use-lang-store'
import Link from 'next/link'
import { Sparkles, Target, BookOpen, Music, Brain, Moon, BarChart2 } from 'lucide-react'

interface CoachTip {
  emoji: string
  title: string
  titleVi: string
  desc: string
  descVi: string
  why: string
  whyVi: string
  action: string
  actionVi: string
  href: string
  color: string
  icon: typeof Sparkles
}

const DAILY_TIPS: CoachTip[] = [
  {
    emoji: '🎧', icon: Music, color: 'from-blue-500 to-cyan-500',
    title: 'Try Sound Therapy', titleVi: 'Thử Âm Thanh Trị Liệu',
    desc: 'Listen to personalized sounds for 30 minutes to reduce tinnitus perception.',
    descVi: 'Nghe âm thanh cá nhân hóa 30 phút để giảm cảm nhận ù tai.',
    why: 'Sound therapy helps your brain habituate to tinnitus — after 3-6 months, most people notice the ringing less.',
    whyVi: 'Âm thanh trị liệu giúp não thích nghi với ù tai (habituation) — sau 3-6 tháng, hầu hết mọi người ít để ý tiếng ù hơn.',
    action: 'Start Therapy →', actionVi: 'Bắt đầu trị liệu →', href: '/therapy',
  },
  {
    emoji: '🎵', icon: Target, color: 'from-teal-500 to-emerald-500',
    title: 'Notch Therapy Session', titleVi: 'Phiên Lọc Âm',
    desc: 'Notch therapy can reduce tinnitus loudness by 25% over time. Do a session today!',
    descVi: 'Liệu pháp lọc âm giảm ù tai đến 25%. Hãy thực hiện hôm nay!',
    why: 'Notch therapy works by filtering your tinnitus frequency, triggering neuroplasticity to reduce neural overactivity.',
    whyVi: 'Lọc âm hoạt động bằng cách lọc tần số ù tai, kích thích tính dẻ o của não để giảm hoạt động thần kinh quá mức.',
    action: 'Start Notch →', actionVi: 'Bắt đầu lọc →', href: '/notch-therapy',
  },
  {
    emoji: '📝', icon: BarChart2, color: 'from-amber-500 to-orange-500',
    title: 'Daily Check-in', titleVi: 'Ghi Nhận Hôm Nay',
    desc: 'Track your mood, sleep, and tinnitus level. Consistency builds powerful insights.',
    descVi: 'Ghi nhận tâm trạng, giấc ngủ, mức ù tai. Kiên trì tạo insight mạnh mẽ.',
    why: 'Tracking patterns helps you identify triggers. Studies show journaling alone reduces tinnitus distress by 15-20%.',
    whyVi: 'Theo dõi pattern giúp nhận ra tác nhân. Nghiên cứu chỉ ra ghi chép giúp giảm 15-20% khó chịu do ù tai.',
    action: 'Check in now →', actionVi: 'Ghi nhận ngay →', href: '/chat',
  },
  {
    emoji: '🧠', icon: Brain, color: 'from-violet-500 to-purple-500',
    title: 'CBT-i Exercise', titleVi: 'Bài Tập Cải Thiện Giấc Ngủ',
    desc: "Challenge negative thoughts about tinnitus. It's proven to reduce distress by 40-60%.",
    descVi: 'Thách thức suy nghĩ tiêu cực. Đã chứng minh giảm 40-60% khó chịu.',
    why: 'CBT helps you reframe how you perceive tinnitus. When the emotional reaction decreases, the perceived volume often drops too.',
    whyVi: 'Bài tập nhận thức giúp bạn thay đổi cách nhìn về ù tai. Khi phản ứng cảm xúc giảm, cường độ cảm nhận cũng giảm theo.',
    action: 'Start CBT-i →', actionVi: 'Bắt đầu →', href: '/cbti',
  },
  {
    emoji: '🌙', icon: Moon, color: 'from-indigo-500 to-violet-500',
    title: 'Wind Down Tonight', titleVi: 'Thư Giãn Tối Nay',
    desc: 'Use sleep mode with brown noise 30 minutes before bed for better sleep quality.',
    descVi: 'Dùng chế độ ngủ với ồn nâu 30 phút trước ngủ để ngủ ngon hơn.',
    why: 'Sleep deprivation makes tinnitus louder. Brown noise has the ideal frequency profile for masking tinnitus during sleep.',
    whyVi: 'Thiếu ngủ làm ù tai to hơn. Ồn nâu có tần số lý tưởng để che phủ ù tai khi ngủ.',
    action: 'Sleep Mode →', actionVi: 'Chế độ ngủ →', href: '/sleep',
  },
  {
    emoji: '📖', icon: BookOpen, color: 'from-blue-500 to-indigo-500',
    title: 'Learn About Tinnitus', titleVi: 'Tìm Hiểu Về Ù Tai',
    desc: 'Knowledge is power. Read about how sound therapy works and why it helps.',
    descVi: 'Kiến thức là sức mạnh. Đọc về cách liệu pháp âm thanh hoạt động.',
    why: 'Understanding tinnitus reduces fear and anxiety about it. Counseling/education alone has a 30% improvement rate.',
    whyVi: 'Hiểu ù tai giảm sợ hãi và lo lắng. Riêng tư vấn/giáo dục đã cải thiện 30% trường hợp.',
    action: 'Read Blog →', actionVi: 'Đọc Blog →', href: '/blog',
  },
]

const BADGES = [
  { emoji: '🔥', label: '3-Day Streak', labelVi: 'Streak 3 Ngày', req: 'Check in 3 days in a row', reqVi: 'Check-in 3 ngày liên tiếp' },
  { emoji: '⭐', label: '7-Day Warrior', labelVi: 'Chiến Binh 7 Ngày', req: '7-day check-in streak', reqVi: 'Streak check-in 7 ngày' },
  { emoji: '🏆', label: 'Sound Explorer', labelVi: 'Khám Phá Âm Thanh', req: 'Try 5 different sounds', reqVi: 'Thử 5 loại âm thanh khác nhau' },
  { emoji: '🧘', label: 'Zen Master', labelVi: 'Thiền Sư', req: 'Complete 10 relaxation sessions', reqVi: 'Hoàn thành 10 phiên thư giãn' },
  { emoji: '📚', label: 'Knowledge Seeker', labelVi: 'Tìm Kiếm Tri Thức', req: 'Read all blog articles', reqVi: 'Đọc tất cả bài viết' },
  { emoji: '🌙', label: 'Sleep Champion', labelVi: 'Nhà Vô Địch Ngủ', req: 'Use sleep mode 7 times', reqVi: 'Dùng chế độ ngủ 7 lần' },
  { emoji: '💎', label: '30-Day Legend', labelVi: 'Huyền Thoại 30 Ngày', req: '30-day check-in streak', reqVi: 'Streak check-in 30 ngày' },
  { emoji: '🎵', label: 'Notch Pro', labelVi: 'Lọc Âm Pro', req: '20 notch therapy sessions', reqVi: '20 phiên lọc âm' },
]

export default function CoachPage() {
  const { lang } = useLangStore()
  const isEn = lang === 'en'

  // Rotate tips based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const todayTips = [0, 1, 2].map(i => DAILY_TIPS[(dayOfYear + i) % DAILY_TIPS.length])

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] left-[20%] w-[250px] h-[250px] rounded-full bg-amber-600/6 blur-[100px]" />
        <div className="absolute bottom-[15%] right-[15%] w-[200px] h-[200px] rounded-full bg-emerald-600/6 blur-[80px]" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Tinni Coach</h1>
          <p className="text-xs text-slate-400">
            {isEn ? "Today's personalized recommendations" : 'Đề xuất cá nhân hóa hôm nay'}
          </p>
        </div>
      </div>

      {/* Daily recommendations */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {isEn ? "📌 Today's Action Plan" : '📌 Kế Hoạch Hôm Nay'}
        </h2>
        <div className="space-y-3">
          {todayTips.map((tip, i) => (
            <Link key={i} href={tip.href}
              className="group flex items-start gap-4 bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tip.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <tip.icon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {isEn ? tip.title : tip.titleVi}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{isEn ? tip.desc : tip.descVi}</p>
                <p className="text-[9px] text-slate-600 mt-1 leading-relaxed">💡 {isEn ? tip.why : tip.whyVi}</p>
                <span className="inline-block mt-2 text-[10px] text-blue-400 group-hover:text-blue-300">
                  {isEn ? tip.action : tip.actionVi}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Achievement Badges */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {isEn ? '🏅 Achievement Badges' : '🏅 Huy Hiệu Thành Tích'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BADGES.map((badge, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center hover:bg-white/[0.04] transition-all group">
              <div className="text-2xl mb-1 grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100">
                {badge.emoji}
              </div>
              <div className="text-[10px] font-medium text-slate-400 group-hover:text-white transition-colors">
                {isEn ? badge.label : badge.labelVi}
              </div>
              <div className="text-[8px] text-slate-600 mt-0.5">
                {isEn ? badge.req : badge.reqVi}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
