"use client"

import { useLayoutEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem("optifactory-theme")
    if (stored === "light" || stored === "dark" || stored === "system") return stored
  } catch {}
  return null
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemTheme()
  return theme
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme)
  document.documentElement.classList.toggle("dark", resolved === "dark")
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    const stored = getStoredTheme()
    applyTheme(stored ?? "light")
    setMounted(true)

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      const current = getStoredTheme()
      if (current === "system") applyTheme("system")
    }
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  return <>{children}</>
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? "light")

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("optifactory-theme", newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    setTheme(next)
  }

  return { theme, setTheme, toggleTheme, isDark: resolveTheme(theme) === "dark" }
}
