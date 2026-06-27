"use client"

import { useState } from "react"

interface InfoTooltipProps {
  text: string
  side?: "top" | "bottom"
}

export function InfoTooltip({ text, side = "top" }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="inline-flex items-center justify-center size-4 rounded-full border border-muted-foreground/40 text-muted-foreground/60 text-[10px] cursor-help leading-none font-semibold hover:border-muted-foreground hover:text-muted-foreground transition-colors select-none">
        ?
      </span>
      {open && (
        <span
          className={`absolute left-1/2 -translate-x-1/2 w-56 px-3 py-2 rounded-md bg-popover border text-popover-foreground text-xs shadow-lg z-50 pointer-events-none ${
            side === "top"
              ? "bottom-full mb-2"
              : "top-full mt-2"
          }`}
        >
          {text}
          <span
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-border rotate-45 ${
              side === "top"
                ? "-bottom-1 border-r border-b"
                : "-top-1 border-l border-t"
            }`}
          />
        </span>
      )}
    </span>
  )
}
