"use client"

import { useState, useCallback } from "react"
import { SimplexResult, ProblemData } from "@/types"
import { solveProblem } from "@/services/simplex"

export function useSolver() {
  const [result, setResult] = useState<SimplexResult | null>(null)
  const [isSolving, setIsSolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const solve = useCallback((problem: ProblemData) => {
    setIsSolving(true)
    setError(null)
    try {
      const res = solveProblem(problem)
      setResult(res)
      return res
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al resolver"
      setError(msg)
      return null
    } finally {
      setIsSolving(false)
    }
  }, [])

  return { result, isSolving, error, solve }
}
