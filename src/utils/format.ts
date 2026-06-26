import { getConfig } from "@/lib/store"

export function formatNumber(value: number): string {
  const precision = getConfig().precision
  return value.toFixed(precision)
}

export function formatCurrency(value: number): string {
  return `$${formatNumber(value)}`
}

export function formatPercentage(value: number): string {
  return `${formatNumber(value)}%`
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
