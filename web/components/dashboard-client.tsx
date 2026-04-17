'use client'

import Link from 'next/link'
import { MessageSquare, Music, Ear, Headphones, ClipboardList, Flame, Heart, TrendingUp, Zap } from 'lucide-react'
import { useLangStore } from '@/stores/use-lang-store'
import { t } from '@/lib/i18n'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'

interface CheckIn {
  mood_score: number
  sleep_score: number
  tinnitus_loudness: number
  created_at: string
}

interface Assessment {
  quiz_type: string
  total_score: number
  created_at: string
}

interface DashboardClientProps {
  data: {
    name: string
    tier: string
    lastCheckin: CheckIn | null
    checkins: CheckIn[]
    assessments: Assessment[]
    therapyCount: number
    streak: number
  }
}

function GradientBar({ label, value, max = 10, gradient }: { label: string; value: number; max?: number; gradient: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#222c2c] border border-[#3f4848]/20 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-[#bfc8c8] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* Daily tips — rotates based on date */
const DAILY_TIPS = [
  { vi: '☕ Caffeine có thể làm ù tai tệ hơn. Hãy thử giảm cà phê trong 1 tuần để xem có khác biệt.', en: '☕ Caffeine can worsen tinnitus. Try reducing coffee for a week and see if it makes a difference.' },
  { vi: '🌙 Nghe âm thanh trị liệu 30 phút trước ngủ giúp não thư giãn và dễ ngủ hơn.', en: '🌙 Listening to therapy sounds 30 minutes before bed helps your brain relax and fall asleep easier.' },
  { vi: '🧘 Stress là nguyên nhân phổ biến làm ù tai nặng hơn. Hãy thử bài tập thở 4-7-8 mỗi ngày.', en: '🧘 Stress is a common trigger for louder tinnitus. Try the 4-7-8 breathing exercise daily.' },
  { vi: '💧 Uống đủ nước! Mất nước có thể làm tăng cường độ ù tai. Mục tiêu: 2 lít/ngày.', en: '💧 Stay hydrated! Dehydration can increase tinnitus intensity. Aim for 2 liters per day.' },
  { vi: '🎧 Sử dụng âm thanh nền nhẹ (mưa, sóng biển) khi làm việc để giảm sự chú ý vào tiếng ù.', en: '🎧 Use soft background sounds (rain, ocean) while working to reduce focus on the ringing.' },
  { vi: '📱 Hạn chế xem màn hình trước khi ngủ 30 phút. Ánh sáng xanh làm rối loạn giấc ngủ.', en: '📱 Limit screen time 30 minutes before bed. Blue light disrupts sleep quality.' },
  { vi: '🎵 Âm nhạc cổ điển hoặc lo-fi có thể giúp che phủ ù tai tự nhiên hơn white noise thuần túy.', en: '🎵 Classical or lo-fi music can mask tinnitus more naturally than pure white noise.' },
  { vi: '🎽 Vận động đều đặn giúp cải thiện tuần hoàn máu, gián tiếp giảm ù tai. 30 phút đi bộ/ngày.', en: '🎽 Regular exercise improves blood circulation, which can indirectly reduce tinnitus. Try 30 min walks daily.' },
  { vi: '🥂 Giảm muối có thể giúp giảm ù tai, đặc biệt nếu bạn bị bệnh Ménière.', en: '🥂 Reducing salt intake can help with tinnitus, especially if you have Ménière\'s disease.' },
  { vi: '📚 Ghi nhận hàng ngày giúp bạn nhận ra pattern: khi nào ù nhiều, khi nào ít — từ đó điều chỉnh lối sống.', en: '📚 Daily logging helps you spot patterns: when tinnitus is loud vs. quiet — so you can adjust your lifestyle.' },
  { vi: '😴 Thử nằm nghiêng về bên tai ít ù hơn khi ngủ, kết hợp với âm thanh trị liệu.', en: '😴 Try sleeping on the side with less tinnitus, combined with therapy sounds.' },
  { vi: '🧠 Habituation (thích nghi) mất trung bình 3-6 tháng. Kiên nhẫn — bạn sẽ quen dần!', en: '🧠 Habituation takes an average of 3-6 months. Be patient — your brain will gradually adapt!' },
  { vi: '🌿 Thử tiền tinh dầu lavender, bạc hà để thư giãn. Mùi hương tốt giúp giảm stress gây ù tai.', en: '🌿 Try lavender or peppermint essential oils for relaxation. Pleasant scents can reduce stress-related tinnitus.' },
  { vi: '👥 Tham gia cộng đồng người ù tai. Chia sẻ kinh nghiệm giúp bạn không cảm thấy cô đơn.', en: '👥 Join tinnitus communities. Sharing experiences helps you feel less alone.' },
]

function getDailyTip(lang: 'vi' | 'en') {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const tip = DAILY_TIPS[dayOfYear % DAILY_TIPS.length]
  return tip[lang]
}

export default function DashboardClient({ data }: DashboardClientProps) {
  const { lang } = useLangStore()
  const d = t(lang)
  const isEn = lang === 'en'

  const { name, lastCheckin, checkins, assessments, therapyCount, streak } = data

  // Format check-in data for line chart
  const checkinChartData = checkins.map(c => ({
    date: new Date(c.created_at).toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { day: '2-digit', month: 'short' }),
    [isEn ? 'Mood' : 'Tâm trạng']: c.mood_score,
    [isEn ? 'Sleep' : 'Giấc ngủ']: c.sleep_score,
    [isEn ? 'Tinnitus' : 'Ù tai']: c.tinnitus_loudness,
  }))

  // Format assessment data for bar chart
  const assessmentChartData = assessments.map(a => ({
    label: `${a.quiz_type} ${new Date(a.created_at).toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { day: '2-digit', month: 'short' })}`,
    score: a.total_score,
    quiz: a.quiz_type,
  }))

  const stats = [
    { icon: Headphones, label: d.dashboard.therapySessions, value: therapyCount.toString(), gradient: 'from-[#94d3c1] to-[#9ad2c0]', glow: 'shadow-[#94d3c1]/20' },
    { icon: ClipboardList, label: d.dashboard.recentAssessments, value: assessments.length.toString(), gradient: 'from-[#024e41] to-[#165042]', glow: 'shadow-[#024e41]/20' },
    { icon: Flame, label: d.dashboard.streak, value: `${streak} ${d.dashboard.days}`, gradient: 'from-[#ffb954] to-[#ffddb4]', glow: 'shadow-[#ffb954]/20' },
    { icon: Heart, label: d.dashboard.mood, value: lastCheckin ? `${lastCheckin.mood_score}/10` : '--', gradient: 'from-[#9ad2c0] to-[#afefdd]', glow: 'shadow-[#9ad2c0]/20' },
  ]

  const quickActions = [
    { icon: MessageSquare, label: d.dashboard.chatWithTinni, desc: d.dashboard.chatDesc, href: '/chat', gradient: 'from-[#94d3c1] to-[#9ad2c0]' },
    { icon: Music, label: d.dashboard.soundTherapy, desc: d.dashboard.soundDesc, href: '/therapy', gradient: 'from-[#024e41] to-[#165042]' },
    { icon: Ear, label: d.dashboard.hearingTest, desc: d.dashboard.hearingDesc, href: '/hearing-test', gradient: 'from-[#ffb954] to-[#ffddb4]' },
  ]

  const locale = lang === 'vi' ? 'vi-VN' : 'en-US'

  const moodKey = isEn ? 'Mood' : 'Tâm trạng'
  const sleepKey = isEn ? 'Sleep' : 'Giấc ngủ'
  const tinnitusKey = isEn ? 'Tinnitus' : 'Ù tai'

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[20%] w-[250px] h-[250px] rounded-full bg-[#024e41]/20 blur-[80px]" />
        <div className="absolute bottom-[30%] left-[10%] w-[200px] h-[200px] rounded-full bg-[#ffb954]/8 blur-[80px]" />
      </div>

      {/* Welcome */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            {d.dashboard.greeting}, <span className="bg-gradient-to-r from-[#94d3c1] to-[#ffb954] bg-clip-text text-transparent">{name}</span>! 👋
          </h1>
          <p className="mt-1 text-[#bfc8c8] text-xs sm:text-sm">
            {isEn ? "Here's your journey overview" : 'Đây là tổng quan hành trình của bạn'}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-[#3f4848]/20 rounded-full">
          <Zap size={14} className="text-[#ffb954]" />
          <span className="text-xs text-[#bfc8c8] capitalize">{data.tier}</span>
        </div>
      </div>

      {/* Daily Tip */}
      <div className="mb-6 sm:mb-8 p-4 bg-gradient-to-r from-[#024e41]/15 to-[#94d3c1]/5 backdrop-blur border border-[#94d3c1]/15 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#94d3c1]/20 flex items-center justify-center text-sm flex-shrink-0">💡</div>
          <div>
            <p className="text-[#94d3c1] text-xs font-medium mb-0.5">{isEn ? 'Tip of the Day' : 'Mẹo hôm nay'}</p>
            <p className="text-[#bfc8c8] text-xs leading-relaxed">{getDailyTip(lang)}</p>
          </div>
        </div>
      </div>

      {/* Onboarding nudge for new users */}
      {checkins.length === 0 && assessments.length === 0 && therapyCount === 0 && (
        <div className="mb-6 sm:mb-8 p-5 bg-gradient-to-br from-[#024e41]/20 via-[#94d3c1]/5 to-transparent border border-[#94d3c1]/20 rounded-2xl">
          <h3 className="text-white font-semibold text-sm mb-2">
            {isEn ? '🌟 Start your tinnitus management journey!' : '🌟 Bắt đầu hành trình kiểm soát ù tai!'}
          </h3>
          <p className="text-slate-400 text-xs mb-4">
            {isEn
              ? 'Here are 3 simple steps to get started. Each one takes less than 5 minutes:'
              : 'Dưới đây là 3 bước đơn giản để bắt đầu. Mỗi bước mất chưa đầy 5 phút:'}
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link href="/chat" className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#94d3c1]/30 rounded-xl transition-all">
              <span className="text-xl">💬</span>
              <div>
                <p className="text-white text-xs font-medium">{isEn ? '1. Talk to Tinni' : '1. Nói chuyện với Tinni'}</p>
                <p className="text-slate-600 text-[9px]">{isEn ? 'Share your symptoms' : 'Chia sẻ triệu chứng'}</p>
              </div>
            </Link>
            <Link href="/hearing-test" className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#ffb954]/30 rounded-xl transition-all">
              <span className="text-xl">🎧</span>
              <div>
                <p className="text-white text-xs font-medium">{isEn ? '2. Test your hearing' : '2. Kiểm tra thính lực'}</p>
                <p className="text-slate-600 text-[9px]">{isEn ? '5 minutes, free' : '5 phút, miễn phí'}</p>
              </div>
            </Link>
            <Link href="/therapy" className="flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#9ad2c0]/30 rounded-xl transition-all">
              <span className="text-xl">🎵</span>
              <div>
                <p className="text-white text-xs font-medium">{isEn ? '3. Try sound therapy' : '3. Nghe âm thanh trị liệu'}</p>
                <p className="text-slate-600 text-[9px]">{isEn ? 'Mask the ringing' : 'Che phủ tiếng ù'}</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map(s => (
          <div key={s.label} className={`relative bg-[#172121] backdrop-blur border border-[#3f4848]/20 rounded-2xl p-4 sm:p-5 hover:bg-[#222c2c] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${s.glow}`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-2 sm:mb-3 shadow-lg ${s.glow}`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div className="text-[10px] sm:text-xs text-[#bfc8c8] mb-1">{s.label}</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-4 mb-6 sm:mb-8">
        {/* Check-in Trends Chart */}
        <div className="bg-[#172121] backdrop-blur border border-[#3f4848]/20 rounded-2xl p-4 sm:p-5">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4 text-sm">
            <TrendingUp size={16} className="text-[#94d3c1]" />
            {isEn ? 'Daily Check-in Trends' : 'Xu Hướng Check-in'}
          </h2>
          {checkinChartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={checkinChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey={moodKey} stroke="#94d3c1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey={sleepKey} stroke="#9ad2c0" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey={tinnitusKey} stroke="#ffb954" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <p className="text-sm text-slate-500 mb-3">{isEn ? 'Check in daily to see trends!' : 'Check-in hàng ngày để xem xu hướng!'}</p>
              <Link href="/chat" className="inline-flex px-4 py-2 bg-gradient-to-r from-[#024e41] to-[#94d3c1] text-[#00201a] text-xs rounded-lg font-medium">
                {d.dashboard.startNow} →
              </Link>
            </div>
          )}
          {checkinChartData.length > 1 && (
            <div className="flex justify-center gap-4 mt-2 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#94d3c1] rounded-full" />{moodKey}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#9ad2c0] rounded-full" />{sleepKey}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#ffb954] rounded-full" />{tinnitusKey}</span>
            </div>
          )}
        </div>

        {/* Assessment History Chart */}
        <div className="bg-[#172121] backdrop-blur border border-[#3f4848]/20 rounded-2xl p-4 sm:p-5">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4 text-sm">
            <ClipboardList size={16} className="text-[#ffb954]" />
            {isEn ? 'Assessment History' : 'Lịch Sử Đánh Giá'}
          </h2>
          {assessmentChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={assessmentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" fill="url(#barGrad)" radius={[4, 4, 0, 0]} name={isEn ? 'Score' : 'Điểm'} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94d3c1" />
                    <stop offset="100%" stopColor="#024e41" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <p className="text-sm text-slate-500 mb-3">{d.dashboard.noAssessments}</p>
              <Link href="/chat" className="inline-flex px-4 py-2 bg-gradient-to-r from-[#024e41] to-[#94d3c1] text-[#00201a] text-xs rounded-lg font-medium">
                {d.dashboard.startNow} →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Last Check-in Detail */}
      <div className="grid md:grid-cols-2 gap-4 mb-6 sm:mb-8">
        <div className="bg-[#172121] backdrop-blur border border-[#3f4848]/20 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
              <TrendingUp size={16} className="text-[#94d3c1]" />
              {d.dashboard.todayCheckin}
            </h2>
            {lastCheckin && (
              <span className="text-xs text-[#899392]">
                {new Date(lastCheckin.created_at).toLocaleDateString(locale)}
              </span>
            )}
          </div>
          {lastCheckin ? (
            <div className="space-y-3">
              <GradientBar label={`😊 ${d.dashboard.mood}`} value={lastCheckin.mood_score} gradient="from-[#94d3c1] to-[#9ad2c0]" />
              <GradientBar label={`😴 ${d.dashboard.sleep}`} value={lastCheckin.sleep_score} gradient="from-[#024e41] to-[#165042]" />
              <GradientBar label={`🔔 ${d.dashboard.tinnitusLoudness}`} value={lastCheckin.tinnitus_loudness} gradient="from-[#ffb954] to-[#ffddb4]" />
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 mb-3">{d.dashboard.noCheckin}</p>
              <Link href="/chat" className="inline-flex px-4 py-2 bg-gradient-to-r from-[#024e41] to-[#94d3c1] text-[#00201a] text-xs rounded-lg font-medium">
                {d.dashboard.startNow} →
              </Link>
            </div>
          )}
        </div>

        {/* Streak Card */}
        <div className="bg-[#172121] backdrop-blur border border-[#3f4848]/20 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-3">{streak > 0 ? '🔥' : '💪'}</div>
          <div className="text-3xl font-bold text-white">{streak}</div>
          <div className="text-xs text-[#bfc8c8] mt-1">
            {isEn ? 'day streak' : 'ngày liên tiếp'}
          </div>
          <p className="text-[10px] text-[#899392] mt-3 max-w-[200px]">
            {isEn
              ? streak > 0 ? 'Keep going! Consistency is key to managing tinnitus.' : 'Start checking in daily to build your streak!'
              : streak > 0 ? 'Tiếp tục nhé! Kiên trì là chìa khóa quản lý ù tai.' : 'Bắt đầu check-in hàng ngày để xây dựng streak!'}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-sm text-[#bfc8c8] uppercase tracking-wider mb-3">{d.dashboard.quickActions}</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href}
              className="group flex items-center gap-3 sm:gap-4 bg-[#172121] hover:bg-[#222c2c] border border-[#3f4848]/20 hover:border-[#94d3c1]/20 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <a.icon size={20} className="text-white" />
              </div>
              <div>
                <div className="font-medium text-xs sm:text-sm text-white group-hover:text-[#94d3c1] transition-colors">{a.label}</div>
                <div className="text-[10px] sm:text-xs text-[#899392]">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
