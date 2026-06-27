import { AppConfig, Exercise, ProblemData, SimplexResult, SolveMethod, ViewMode } from "@/types"

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

const STORAGE_KEY = "optifactory-problems"

function ensureId(p: ProblemData): ProblemData {
  return p.id ? p : { ...p, id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}` }
}

export function saveProblem(problem: ProblemData): void {
  if (typeof window === "undefined") return
  const withId = ensureId(problem)
  const list = getSavedProblems()
  const idx = list.findIndex((p) => p.id === withId.id)
  if (idx >= 0) {
    list[idx] = withId
  } else {
    list.push(withId)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getSavedProblems(): ProblemData[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list: ProblemData[] = raw ? JSON.parse(raw) : []
    // migrate any problems without id
    const migrated = list.map((p) => ensureId(p))
    const hasMigrated = migrated.some((p, i) => p.id !== list[i]?.id)
    if (hasMigrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    }
    return migrated
  } catch {
    return []
  }
}

export function deleteSavedProblem(id: string): void {
  if (typeof window === "undefined") return
  const list = getSavedProblems().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const EXERCISES_KEY = "optifactory-exercises"

export function saveExercise(exercise: Exercise): void {
  if (typeof window === "undefined") return
  const list = getSavedExercises()
  const idx = list.findIndex((e) => e.title === exercise.title)
  if (idx >= 0) {
    list[idx] = exercise
  } else {
    list.push(exercise)
  }
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(list))
}

export function getSavedExercises(): Exercise[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(EXERCISES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function deleteSavedExercise(title: string): void {
  if (typeof window === "undefined") return
  const list = getSavedExercises().filter((e) => e.title !== title)
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(list))
}
