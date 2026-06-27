import { AppConfig } from "@/types"

export const defaultConfig: AppConfig = {
  theme: "light",
  language: "es",
  precision: 4,
  defaultMethod: "AUTO",
  animations: true,
  autoDetectMethod: true,
}

export function getConfig(): AppConfig {
  if (typeof window === "undefined") return defaultConfig
  const stored = localStorage.getItem("optifactory-config")
  if (stored) {
    try {
      return { ...defaultConfig, ...JSON.parse(stored) }
    } catch {
      return defaultConfig
    }
  }
  return defaultConfig
}

export function saveConfig(config: AppConfig): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("optifactory-config", JSON.stringify(config))
  }
}

export function getTheme(): AppConfig["theme"] {
  const config = getConfig()
  if (config.theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return config.theme
}
