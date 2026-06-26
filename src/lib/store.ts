import { AppConfig, ProblemData, SimplexResult, SolveMethod, ViewMode } from "@/types"

const defaultConfig: AppConfig = {
  theme: "light",
  language: "es",
  precision: 4,
  defaultMethod: "AUTO",
  animations: true,
  viewMode: "student",
  autoDetectMethod: true,
}

let config: AppConfig = { ...defaultConfig }

const listeners = new Set<() => void>()

export function getConfig(): AppConfig {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("optifactory-config")
    if (stored) {
      try {
        config = { ...defaultConfig, ...JSON.parse(stored) }
      } catch {}
    }
  }
  return config
}

export function updateConfig(partial: Partial<AppConfig>) {
  config = { ...config, ...partial }
  if (typeof window !== "undefined") {
    localStorage.setItem("optifactory-config", JSON.stringify(config))
  }
  listeners.forEach((l) => l())
}

export function subscribeToConfig(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function translate(es: string, en: string): string {
  return config.language === "es" ? es : en
}

let currentProblem: ProblemData | null = null

export function setCurrentProblem(problem: ProblemData) {
  currentProblem = problem
}

export function getCurrentProblem(): ProblemData | null {
  return currentProblem
}

let currentResult: SimplexResult | null = null

export function setCurrentResult(result: SimplexResult | null) {
  currentResult = result
}

export function getCurrentResult(): SimplexResult | null {
  return currentResult
}
