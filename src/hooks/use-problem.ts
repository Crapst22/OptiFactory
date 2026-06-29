"use client"

import { useState, useCallback } from "react"
import { ProblemData, ConstraintRow, SolveMethod, ProblemType, VariableType } from "@/types"

const defaultProblem: ProblemData = {
  title: "Nuevo Problema",
  problemType: "MAX",
  method: "AUTO",
  variables: 2,
  constraints: 2,
  objective: [30, 40],
  constraintsData: [
    { coefficients: [2, 1], operator: "<=", value: 100 },
    { coefficients: [1, 2], operator: "<=", value: 80 },
  ],
  variableTypes: ["positive", "positive"],
}

export function useProblem() {
  const [problem, setProblem] = useState<ProblemData>(defaultProblem)

  const setTitle = useCallback((title: string) => {
    setProblem((p) => ({ ...p, title }))
  }, [])

  const setProblemType = useCallback((problemType: ProblemType) => {
    setProblem((p) => ({ ...p, problemType }))
  }, [])

  const setMethod = useCallback((method: SolveMethod) => {
    setProblem((p) => ({ ...p, method }))
  }, [])

  const setVariables = useCallback((n: number) => {
    setProblem((p) => {
      const vars = Math.max(2, Math.min(20, n))
      const obj = Array(vars).fill(0).map((_, i) => p.objective[i] ?? 10)
      const cons = p.constraintsData.map((row) => ({
        ...row,
        coefficients: Array(vars).fill(0).map((_, i) => row.coefficients[i] ?? 1),
      }))
      const types: VariableType[] = Array(vars).fill("positive").map((_, i) => p.variableTypes[i] ?? "positive")
      return { ...p, variables: vars, objective: obj, constraintsData: cons, variableTypes: types }
    })
  }, [])

  const setConstraints = useCallback((n: number) => {
    setProblem((p) => {
      const cons = Math.max(1, Math.min(20, n))
      const rows: ConstraintRow[] = Array(cons).fill(null).map((_, i) => p.constraintsData[i] ?? {
        coefficients: Array(p.variables).fill(1),
        operator: "<=" as const,
        value: 100,
      })
      return { ...p, constraints: cons, constraintsData: rows }
    })
  }, [])

  const setObjective = useCallback((index: number, value: number) => {
    setProblem((p) => {
      const obj = [...p.objective]
      obj[index] = value
      return { ...p, objective: obj }
    })
  }, [])

  const setConstraintCoefficient = useCallback(
    (constraintIndex: number, variableIndex: number, value: number) => {
      setProblem((p) => {
        const rows = p.constraintsData.map((row, i) => {
          if (i !== constraintIndex) return row
          const coeffs = [...row.coefficients]
          coeffs[variableIndex] = value
          return { ...row, coefficients: coeffs }
        })
        return { ...p, constraintsData: rows }
      })
    },
    []
  )

  const setConstraintOperator = useCallback(
    (constraintIndex: number, operator: "<=" | ">=" | "=") => {
      setProblem((p) => {
        const rows = p.constraintsData.map((row, i) =>
          i === constraintIndex ? { ...row, operator } : row
        )
        return { ...p, constraintsData: rows }
      })
    },
    []
  )

  const setConstraintValue = useCallback((constraintIndex: number, value: number) => {
    setProblem((p) => {
      const rows = p.constraintsData.map((row, i) =>
        i === constraintIndex ? { ...row, value } : row
      )
      return { ...p, constraintsData: rows }
    })
  }, [])

  const addConstraint = useCallback(() => {
    setProblem((p) => ({
      ...p,
      constraints: p.constraints + 1,
      constraintsData: [
        ...p.constraintsData,
        {
          coefficients: Array(p.variables).fill(1),
          operator: "<=" as const,
          value: 100,
        },
      ],
    }))
  }, [])

  const removeConstraint = useCallback((index: number) => {
    setProblem((p) => ({
      ...p,
      constraints: Math.max(1, p.constraints - 1),
      constraintsData: p.constraintsData.filter((_, i) => i !== index),
    }))
  }, [])

  const duplicateConstraint = useCallback((index: number) => {
    setProblem((p) => {
      const row = { ...p.constraintsData[index] }
      return {
        ...p,
        constraints: p.constraints + 1,
        constraintsData: [
          ...p.constraintsData.slice(0, index + 1),
          row,
          ...p.constraintsData.slice(index + 1),
        ],
      }
    })
  }, [])

  const setVariableType = useCallback((index: number, type: VariableType) => {
    setProblem((p) => {
      const types = [...p.variableTypes]
      types[index] = type
      return { ...p, variableTypes: types }
    })
  }, [])

  const reset = useCallback(() => {
    setProblem(defaultProblem)
  }, [])

  return {
    problem,
    setTitle,
    setProblemType,
    setMethod,
    setVariables,
    setConstraints,
    setObjective,
    setConstraintCoefficient,
    setConstraintOperator,
    setConstraintValue,
    addConstraint,
    removeConstraint,
    duplicateConstraint,
    setVariableType,
    reset,
  }
}
