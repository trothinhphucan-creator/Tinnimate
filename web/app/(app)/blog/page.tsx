'use client'

import Link from 'next/link'
import { useLangStore } from '@/stores/use-lang-store'
import { BLOG_POSTS } from '@/lib/blog-data'
import { BookOpen, Clock, ArrowRight } from 'lucide-react'

const CAT_LABELS: Record<string, { vi: string; en: string; color: string }> = {
  basics: { vi: 'Kiến thức', en: 'Basics', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  therapy: { vi: 'Trị liệu', en: 'Therapy', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  wellness: { vi: 'Sức khỏe', en: 'Wellness', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  science: { vi: 'Khoa học', en: 'Science', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
}

export default function BlogPage() {
  const { lang } = useLangStore()
  const isEn = lang === 'en'

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[15%] w-[250px] h-[250px] rounded-full bg-blue-600/6 blur-[100px]" />
        <div className="absolute bottom-[25%] left-[10%] w-[200px] h-[200px] rounded-full bg-emerald-600/6 blur-[80px]" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {isEn ? 'Tinnitus Knowledge Hub' : 'Kiến Thức Về Ù Tai'}
          </h1>
          <p className="text-xs text-slate-400">
            {isEn ? 'Evidence-based articles to help you understand and manage tinnitus' : 'Bài viết dựa trên bằng chứng giúp bạn hiểu và quản lý ù tai'}
          </p>
        </div>
      </div>

      {/* Article grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {BLOG_POSTS.map(post => {
          const cat = CAT_LABELS[post.category]
          return (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="group bg-white/[0.02] backdrop-blur border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{post.emoji}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cat.color}`}>
                  {isEn ? cat.en : cat.vi}
                </span>
              </div>
              <h2 className="font-semibold text-white text-sm mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                {isEn ? post.title : post.titleVi}
              </h2>
              <p className="text-xs text-slate-400 mb-4 line-clamp-2 flex-1">
                {isEn ? post.excerpt : post.excerptVi}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {post.readTime} {isEn ? 'min read' : 'phút đọc'}
                </span>
                <span className="flex items-center gap-1 text-blue-400 group-hover:text-blue-300">
                  {isEn ? 'Read' : 'Đọc'} <ArrowRight size={10} />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
