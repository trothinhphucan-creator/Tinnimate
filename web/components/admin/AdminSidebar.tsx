'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
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
  UsersRound,
  CreditCard,
  Tag,
  BarChart3,
  Receipt,
  MessagesSquare,
  ChevronDown,
  ChevronRight,
  Shield,
  Smartphone,
  Film,
  BookOpen,
  Radio,
  ListChecks,
  Rss,
  History,
  MessageCircle,
  SlidersHorizontal,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string; icon: React.ElementType }
type NavGroup = { label: string; icon: React.ElementType; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: "Operations",
    icon: LayoutDashboard,
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/reports", label: "Activity Reports", icon: BarChart3 },
      { href: "/admin/audit", label: "Audit Log", icon: Shield },
    ],
  },
  {
    label: "CRM",
    icon: UsersRound,
    items: [
      { href: "/admin/users", label: "Users", icon: UsersRound },
      { href: "/admin/conversations", label: "Conversations", icon: MessagesSquare },
    ],
  },
  {
    label: "Monetization",
    icon: CreditCard,
    items: [
      { href: "/admin/pricing", label: "Plans & Pricing", icon: CreditCard },
      { href: "/admin/promotions", label: "Promotions", icon: Tag },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: Receipt },
      { href: "/admin/orders", label: "Payment Orders", icon: Receipt },
    ],
  },
  {
    label: "System",
    icon: Settings,
    items: [
      { href: "/admin/config", label: "AI Config", icon: Settings },
      { href: "/admin/models", label: "LLM Models", icon: Cpu },
      { href: "/admin/prompts", label: "System Prompts", icon: FileText },
      { href: "/admin/knowledge", label: "Knowledge Base", icon: Database },
      { href: "/admin/examples", label: "Few-shot Examples", icon: BookOpen },
      { href: "/admin/training", label: "Training Chat", icon: Bot },
      { href: "/admin/mobile-config", label: "Mobile Config", icon: Smartphone },
      { href: "/admin/video-creator", label: "Video Creator", icon: Film },
    ],
  },
  {
    label: "Social Listening",
    icon: Radio,
    items: [
      { href: "/admin/social-listening",          label: "Dashboard",     icon: BarChart3 },
      { href: "/admin/social-listening/queue",     label: "Review Queue",  icon: ListChecks },
      { href: "/admin/social-listening/comments",  label: "Comment Inbox", icon: MessageCircle },
      { href: "/admin/social-listening/sources",   label: "Sources",       icon: Rss },
      { href: "/admin/social-listening/pages",     label: "Fanpages",      icon: Radio },
      { href: "/admin/social-listening/status",    label: "Scrape Status", icon: Activity },
      { href: "/admin/social-listening/history",   label: "History",       icon: History },
      { href: "/admin/social-listening/settings",  label: "AI Settings",   icon: SlidersHorizontal },
    ],
  },
]

function NavGroup({ group, defaultOpen = true }: { group: NavGroup; defaultOpen?: boolean }) {
  const pathname = usePathname()

  const isGroupActive = group.items.some(item =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
  )

  // Auto-open if any child route is active; otherwise use defaultOpen
  const [open, setOpen] = useState(defaultOpen || isGroupActive)

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors",
          isGroupActive ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
        )}
      >
        <span className="flex items-center gap-2">
          <group.icon className="h-3.5 w-3.5" />
          {group.label}
        </span>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-0.5 space-y-0.5 pl-2">
          {group.items.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-colors",
                  isActive
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 border-r border-slate-800 flex flex-col z-40">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
        <Brain className="h-5 w-5 text-blue-500" />
        <span className="font-semibold text-white text-sm">TinniMate Admin</span>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-2">
        <NavGroup group={navGroups[0]} defaultOpen={true} />
        <NavGroup group={navGroups[1]} defaultOpen={true} />
        <NavGroup group={navGroups[2]} defaultOpen={true} />
        <NavGroup group={navGroups[3]} defaultOpen={false} />
        <NavGroup group={navGroups[4]} defaultOpen={false} />
      </nav>

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
