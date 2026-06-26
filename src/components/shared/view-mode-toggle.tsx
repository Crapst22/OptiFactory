"use client"

import { useConfig } from "@/hooks/use-config"

export function ViewModeToggle() {
  const { config, updateConfig } = useConfig()
  const isStudent = config.viewMode === "student"

  return (
    <div className="flex items-center gap-2 rounded-lg border p-1">
      <button
        onClick={() => updateConfig({ viewMode: "student" })}
        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          isStudent ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Estudiante
      </button>
      <button
        onClick={() => updateConfig({ viewMode: "professional" })}
        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
          !isStudent ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Profesional
      </button>
    </div>
  )
}
