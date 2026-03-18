'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Settings,
  FileText,
  Database,
  MessageSquare,
  Bot,
  Brain,
  ArrowLeft,
  Cpu,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/config", label: "AI Config", icon: Settings },
  { href: "/admin/models", label: "LLM Models", icon: Cpu },
  { href: "/admin/prompts", label: "System Prompts", icon: FileText },
  { href: "/admin/knowledge", label: "Knowledge Base", icon: Database },
  { href: "/admin/examples", label: "Few-shot Examples", icon: MessageSquare },
  { href: "/admin/training", label: "Training Chat", icon: Bot },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 border-r border-slate-800 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
        <Brain className="h-5 w-5 text-blue-500" />
        <span className="font-semibold text-white text-sm">TinniMate Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Back to App */}
      <div className="px-3 py-4 border-t border-slate-800">
        <Link
          href="/chat"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to App
        </Link>
      </div>
    </aside>
  )
}
