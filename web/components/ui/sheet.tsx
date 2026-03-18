'use client'

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue>({ open: false, setOpen: () => {} })

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Sheet({ open: controlled, onOpenChange, children }: SheetProps) {
  const [internal, setInternal] = React.useState(false)
  const open = controlled !== undefined ? controlled : internal
  const setOpen = (v: boolean) => {
    if (controlled === undefined) setInternal(v)
    onOpenChange?.(v)
  }
  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

function SheetTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { setOpen } = React.useContext(SheetContext)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    })
  }
  return <span onClick={() => setOpen(true)}>{children}</span>
}

function SheetContent({ children, className, side = "right" }: {
  children: React.ReactNode
  className?: string
  side?: "left" | "right" | "top" | "bottom"
}) {
  const { open, setOpen } = React.useContext(SheetContext)
  if (!open) return null

  const sideClasses = {
    right: "right-0 top-0 h-full w-3/4 max-w-sm",
    left: "left-0 top-0 h-full w-3/4 max-w-sm",
    top: "top-0 left-0 w-full",
    bottom: "bottom-0 left-0 w-full",
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className={cn(
        "fixed z-50 bg-background p-6 shadow-lg",
        sideClasses[side],
        className
      )}>
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

function SheetHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-1.5 mb-4", className)}>{children}</div>
}

function SheetTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle }
