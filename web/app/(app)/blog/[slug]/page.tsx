'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useLangStore } from '@/stores/use-lang-store'
import { BLOG_POSTS } from '@/lib/blog-data'
import { ArrowLeft, Clock } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { lang } = useLangStore()
  const isEn = lang === 'en'
  const post = BLOG_POSTS.find(p => p.slug === slug)

  if (!post) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-xl mb-2">📄</p>
          <p>{isEn ? 'Article not found' : 'Không tìm thấy bài viết'}</p>
          <Link href="/blog" className="text-blue-400 underline mt-2 block text-sm">← Blog</Link>
        </div>
      </div>
    )
  }

  const content = isEn ? post.content : post.contentVi

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <Link href="/blog" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 mb-6 transition-colors">
        <ArrowLeft size={14} /> {isEn ? 'Back to articles' : 'Quay lại danh sách'}
      </Link>

      <article>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{post.emoji}</span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {isEn ? post.title : post.titleVi}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime} {isEn ? 'min' : 'phút'}</span>
              <span>{new Date(post.date).toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="prose prose-invert prose-sm max-w-none 
          prose-headings:text-white prose-headings:font-semibold
          prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
          prose-h3:text-sm prose-h3:mt-5 prose-h3:mb-2 prose-h3:text-blue-300
          prose-h4:text-xs prose-h4:mt-4 prose-h4:mb-1 prose-h4:text-slate-300
          prose-p:text-slate-300 prose-p:text-sm prose-p:leading-relaxed
          prose-li:text-sm prose-li:text-slate-300
          prose-strong:text-white
          prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          prose-ul:my-2 prose-ol:my-2
        ">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </article>
    </div>
  )
}
