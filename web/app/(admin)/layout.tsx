import type { ReactNode } from "react"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { ToastProvider } from "@/hooks/use-toast"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-slate-900 text-white">
        <AdminSidebar />
        <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
