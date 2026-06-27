"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

interface InfoTooltipProps {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.top, left: rect.left + rect.width / 2 })
    }
  }, [open])

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex items-center justify-center size-5 rounded-full border border-muted-foreground/50 text-muted-foreground/70 text-[11px] cursor-help leading-none font-semibold hover:border-muted-foreground hover:text-muted-foreground transition-colors select-none shrink-0"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        ?
      </span>
      {open && createPortal(
        <div
          className="fixed z-[100] pointer-events-none"
          style={{ bottom: window.innerHeight - pos.top + 8, left: pos.left }}
        >
          <div className="relative -translate-x-1/2 px-3 py-2 rounded-md bg-popover border text-popover-foreground text-xs shadow-lg max-w-60 leading-relaxed">
            {text}
            <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-px w-2 h-2 bg-popover border-r border-b border-border rotate-45" />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
