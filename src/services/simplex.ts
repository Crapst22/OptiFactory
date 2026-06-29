import { SimplexResult, SimplexStep, SimplexTable, SolveMethod, ProblemData, ConstraintRow, SensitivityAnalysis, SensitivityCoefficient, SensitivityConstraint } from "@/types"

const EPSILON = 1e-10

function isZero(v: number): boolean {
  return Math.abs(v) < EPSILON
}

function generateVariableNames(count: number): string[] {
  const names: string[] = []
  for (let i = 0; i < count; i++) {
    names.push(`X${i + 1}`)
  }
  return names
}

function generateSlackNames(vars: number, constraints: number): string[] {
  const names: string[] = []
  for (let i = 0; i < constraints; i++) {
    names.push(`H${i + 1}`)
  }
  return names
}

function toStandardForm(problem: ProblemData): {
  coefficients: number[][]
  objective: number[]
  signs: string[]
  values: number[]
  isMaximization: boolean
} {
  const isMaximization = problem.problemType === "MAX"
  const numVars = problem.variables
  const numConstraints = problem.constraints

  const objCoeffs = [...problem.objective]
  if (!isMaximization) {
    for (let i = 0; i < objCoeffs.length; i++) {
      objCoeffs[i] = -objCoeffs[i]
    }
  }

  const coefficients: number[][] = []
  const signs: string[] = []
  const values: number[] = []

  for (let i = 0; i < numConstraints; i++) {
    const row = problem.constraintsData[i]
    coefficients.push([...row.coefficients])
    signs.push(row.operator)
    values.push(row.value)
  }

  return { coefficients, objective: objCoeffs, signs, values, isMaximization }
}

function buildInitialTableau(
  coefficients: number[][],
  objective: number[],
  signs: string[],
  values: number[],
  method: SolveMethod,
  variableTypes: string[]
): {
  tableau: number[][]
  basis: string[]
  headers: string[]
  artificialVariables: number
  bigMpenalty: number
} {
  const numVars = objective.length
  const numConstraints = coefficients.length
  const varNames = generateVariableNames(numVars)
  const slackNames = generateSlackNames(numVars, numConstraints)
  const bigMpenalty = 1e6

  let artificialCount = 0
  for (const sign of signs) {
    if (sign === ">=" || sign === "=") artificialCount++
  }

  const totalCols = numVars + numConstraints + artificialCount + 1
  const headers: string[] = []
  for (const v of varNames) headers.push(v)
  for (const s of slackNames) headers.push(s)
  for (let i = 0; i < artificialCount; i++) headers.push(`A${i + 1}`)
  headers.push("Solution")

  const tableau: number[][] = []
  const basis: string[] = []
  let artificialIdx = 0

  for (let i = 0; i < numConstraints; i++) {
    const row = new Array(totalCols).fill(0)
    for (let j = 0; j < numVars; j++) {
      row[j] = coefficients[i][j]
    }
    if (signs[i] === "<=") {
      row[numVars + i] = 1
      basis.push(slackNames[i])
    } else if (signs[i] === ">=") {
      row[numVars + i] = -1
      row[numVars + numConstraints + artificialIdx] = 1
      basis.push(`A${artificialIdx + 1}`)
      artificialIdx++
    } else {
      row[numVars + numConstraints + artificialIdx] = 1
      basis.push(`A${artificialIdx + 1}`)
      artificialIdx++
    }
    row[totalCols - 1] = values[i]
    tableau.push(row)
  }

  const zRow = new Array(totalCols).fill(0)
  for (let j = 0; j < numVars; j++) {
    zRow[j] = -objective[j]
  }

  if (method === "BIG_M" && artificialCount > 0) {
    artificialIdx = 0
    for (let i = 0; i < numConstraints; i++) {
      if (signs[i] === ">=" || signs[i] === "=") {
        for (let j = 0; j < totalCols; j++) {
          zRow[j] -= bigMpenalty * tableau[i][j]
        }
        artificialIdx++
      }
    }
  }

  tableau.push(zRow)

  return { tableau, basis, headers, artificialVariables: artificialCount, bigMpenalty }
}

function findPivotColumn(zRow: number[], headers: string[]): number {
  let minVal = 0
  let pivotCol = -1
  for (let j = 0; j < zRow.length - 1; j++) {
    if (headers[j].startsWith("A")) continue
    if (zRow[j] < -EPSILON) {
      if (pivotCol === -1 || zRow[j] < minVal) {
        minVal = zRow[j]
        pivotCol = j
      }
    }
  }
  return pivotCol
}

function findPivotRow(tableau: number[][], pivotCol: number): number {
  let minRatio = Infinity
  let pivotRow = -1
  for (let i = 0; i < tableau.length - 1; i++) {
    if (tableau[i][pivotCol] > EPSILON) {
      const ratio = tableau[i][tableau[0].length - 1] / tableau[i][pivotCol]
      if (ratio < minRatio) {
        minRatio = ratio
        pivotRow = i
      }
    }
  }
  return pivotRow
}

function pivot(
  tableau: number[][],
  pivotRow: number,
  pivotCol: number,
  basis: string[],
  headers: string[]
): void {
  const pivotElement = tableau[pivotRow][pivotCol]
  for (let j = 0; j < tableau[0].length; j++) {
    tableau[pivotRow][j] /= pivotElement
  }
  for (let i = 0; i < tableau.length; i++) {
    if (i !== pivotRow) {
      const factor = tableau[i][pivotCol]
      for (let j = 0; j < tableau[0].length; j++) {
        tableau[i][j] -= factor * tableau[pivotRow][j]
      }
    }
  }
  basis[pivotRow] = headers[pivotCol]
}

function extractResult(
  tableau: number[][],
  basis: string[],
  headers: string[],
  varNames: string[],
  numConstraints: number,
  isMaximization: boolean,
  steps: SimplexStep[],
  phase2Count = 0
): SimplexResult {
  const zRow = tableau[tableau.length - 1]
  const numVars = varNames.length
  const slackNames = generateSlackNames(numVars, numConstraints)

  const optimalValue = isMaximization ? zRow[zRow.length - 1] : -zRow[zRow.length - 1]
  const variables: Record<string, number> = {}
  const slackVariables: Record<string, number> = {}

  for (let i = 0; i < numVars; i++) {
    variables[varNames[i]] = 0
  }
  for (const s of slackNames) {
    slackVariables[s] = 0
  }

  for (let i = 0; i < basis.length; i++) {
    const b = basis[i]
    const val = tableau[i][tableau[0].length - 1]
    if (variables[b] !== undefined) variables[b] = val
    if (slackVariables[b] !== undefined) slackVariables[b] = val
  }

  let status: SimplexResult["status"] = "OPTIMAL"
  let statusExplanation = ""

  const allNonBasicZero = true
  const hasArtificial = basis.some((b) => b.startsWith("A"))

  if (hasArtificial) {
    for (let i = 0; i < basis.length; i++) {
      if (basis[i].startsWith("A") && Math.abs(tableau[i][tableau[0].length - 1]) > EPSILON) {
        status = "INFEASIBLE"
        statusExplanation =
          "El problema no tiene solución factible. Las restricciones son inconsistentes entre sí."
        break
      }
    }
  }

  if (status === "OPTIMAL") {
    statusExplanation =
      "Se ha encontrado la solución óptima. No es posible mejorar el valor de la función objetivo respetando todas las restricciones."
  }

  return {
    optimal: status === "OPTIMAL",
    optimalValue: Math.round(optimalValue * 1e6) / 1e6,
    variables,
    slackVariables,
    steps,
    method: "SIMPLEX",
    iterations: phase2Count,
    status,
    statusExplanation,
    timeMs: 0,
  }
}

export function solveSimplex(problem: ProblemData): SimplexResult {
  const startTime = performance.now()
  const { coefficients, objective, signs, values, isMaximization } = toStandardForm(problem)
  const varNames = generateVariableNames(problem.variables)
  const { tableau, basis, headers, artificialVariables, bigMpenalty } = buildInitialTableau(
    coefficients,
    objective,
    signs,
    values,
    problem.method,
    problem.variableTypes
  )

  const steps: SimplexStep[] = []
  let iteration = 0
  const maxIterations = 100
  let phase2Count = 0
  let phase2Started = artificialVariables === 0

  while (iteration < maxIterations) {
    const zRow = tableau[tableau.length - 1]
    const pivotCol = findPivotColumn(zRow, headers)
    const currentTable: SimplexTable = {
      headers,
      rows: tableau.slice(0, -1).map(r => [...r]),
      zRow: [...zRow],
      basis: [...basis],
      solution: tableau.map((row) => row[row.length - 1]),
    }

    if (pivotCol === -1) {
      steps.push({
        iteration,
        table: currentTable,
        isOptimal: true,
        explanation: "All coefficients in Z row are non-negative. Optimal solution reached.",
        explanationSpanish:
          "Todos los coeficientes de la fila Z son no negativos. Se ha alcanzado la solución óptima.",
      })
      break
    }

    const pivotRow = findPivotRow(tableau, pivotCol)

    if (pivotRow === -1) {
      steps.push({
        iteration,
        table: currentTable,
        isOptimal: false,
        explanation: "Problem is unbounded. No limiting constraint found.",
        explanationSpanish:
          "El problema no está acotado. No se encontró una restricción limitante.",
      })
      return {
        optimal: false,
        optimalValue: 0,
        variables: {},
        slackVariables: {},
        steps,
        method: "SIMPLEX",
        iterations: phase2Count,
        status: "UNBOUNDED",
        statusExplanation:
          "El problema no está acotado. La función objetivo puede aumentar indefinidamente sin violar restricciones.",
        timeMs: performance.now() - startTime,
      }
    }

    const enteringVar = headers[pivotCol]
    const leavingVar = basis[pivotRow]

    const pivotExplanation = buildPivotExplanation(
      headers,
      basis,
      pivotCol,
      pivotRow,
      zRow,
      tableau,
      varNames,
      iteration
    )

    steps.push({
      iteration,
      table: currentTable,
      pivotColumn: pivotCol,
      pivotRow: pivotRow,
      pivotElement: tableau[pivotRow][pivotCol],
      enteringVariable: enteringVar,
      leavingVariable: leavingVar,
      explanation: pivotExplanation.en,
      explanationSpanish: pivotExplanation.es,
      isOptimal: false,
    })

    pivot(tableau, pivotRow, pivotCol, basis, headers)
    iteration++

    if (!phase2Started && !basis.some(b => b.startsWith("A"))) {
      phase2Started = true
    } else if (phase2Started) {
      phase2Count++
    }
  }

  const result = extractResult(
    tableau,
    basis,
    headers,
    varNames,
    problem.constraints,
    isMaximization,
    steps,
    iteration
  )
  result.timeMs = performance.now() - startTime
  return result
}

function solveTwoPhaseSimplex(problem: ProblemData, startTime: number): SimplexResult {
  const { coefficients, objective, signs, values, isMaximization } = toStandardForm(problem)
  const varNames = generateVariableNames(problem.variables)
  const numConstraints = problem.constraints
  const numVars = problem.variables

  const { tableau, basis, headers, artificialVariables } = buildInitialTableau(
    coefficients, objective, signs, values, "SIMPLEX", problem.variableTypes
  )

  const totalCols = tableau[0].length
  const zRow = tableau[tableau.length - 1]
  let iteration = 0
  const maxIterations = 100
  const steps: SimplexStep[] = []

  // --- PHASE I ---
  // Save original objective coefficients for Phase II
  const originalObjCoeffs = [...zRow]

  // Set Phase I objective: maximize -sum(artificials)
  for (let j = 0; j < totalCols - 1; j++) {
    zRow[j] = headers[j].startsWith("A") ? 1 : 0
  }
  zRow[totalCols - 1] = 0

  // Adjust zRow for basic artificials: for each row with artificial in basis, subtract the row
  for (let i = 0; i < numConstraints; i++) {
    if (basis[i].startsWith("A")) {
      for (let j = 0; j < totalCols; j++) {
        zRow[j] -= tableau[i][j]
      }
    }
  }

  // Phase I simplex loop
  while (iteration < maxIterations) {
    const pivotCol = findPivotColumn(zRow, headers)
    const currentTable: SimplexTable = {
      headers,
      rows: tableau.slice(0, -1).map(r => [...r]),
      zRow: [...zRow],
      basis: [...basis],
      solution: tableau.map((row) => row[row.length - 1]),
    }

    if (pivotCol === -1) {
      steps.push({
        iteration,
        table: currentTable,
        isOptimal: true,
        explanation: "Phase I complete. A feasible basis has been found.",
        explanationSpanish:
          "Fase I completada. Se ha encontrado una base factible.",
      })
      break
    }

    const pivotRow = findPivotRow(tableau, pivotCol)
    if (pivotRow === -1) {
      steps.push({
        iteration,
        table: currentTable,
        isOptimal: false,
        explanation: "Phase I: Problem is unbounded.",
        explanationSpanish: "Fase I: El problema no está acotado.",
      })
      return {
        optimal: false, optimalValue: 0, variables: {}, slackVariables: {},
        steps, method: "SIMPLEX", iterations: iteration,
        status: "UNBOUNDED",
        statusExplanation: "El problema no tiene solución acotada.",
        timeMs: performance.now() - startTime,
      }
    }

    const enteringVar = headers[pivotCol]
    const leavingVar = basis[pivotRow]
    const pivotExplanation = buildPivotExplanation(
      headers, basis, pivotCol, pivotRow, zRow, tableau, varNames, iteration
    )

    steps.push({
      iteration,
      table: currentTable,
      pivotColumn: pivotCol,
      pivotRow,
      pivotElement: tableau[pivotRow][pivotCol],
      enteringVariable: enteringVar,
      leavingVariable: leavingVar,
      explanation: pivotExplanation.en,
      explanationSpanish: pivotExplanation.es,
      isOptimal: false,
    })

    pivot(tableau, pivotRow, pivotCol, basis, headers)
    iteration++
  }

  // Check feasibility: any basic artificial with non-zero value?
  for (let i = 0; i < numConstraints; i++) {
    if (basis[i].startsWith("A") && Math.abs(tableau[i][totalCols - 1]) > EPSILON) {
      return {
        optimal: false,
        optimalValue: 0,
        variables: {},
        slackVariables: {},
        steps,
        method: "SIMPLEX",
        iterations: 0,
        status: "INFEASIBLE",
        statusExplanation:
          "El problema no tiene solución factible. Las restricciones son inconsistentes entre sí.",
        timeMs: performance.now() - startTime,
      }
    }
  }

  // --- TRANSITION TO PHASE II ---
  // Restore original objective coefficients
  for (let j = 0; j < totalCols - 1; j++) {
    zRow[j] = originalObjCoeffs[j]
  }
  zRow[totalCols - 1] = 0

  // Remove any artificials still in basis (degenerate at value 0) before Phase II
  for (let r = 0; r < numConstraints; r++) {
    if (!basis[r].startsWith("A")) continue
    if (!isZero(tableau[r][totalCols - 1])) continue

    let pivotCol = -1
    for (let j = 0; j < totalCols - 1; j++) {
      const h = headers[j]
      if (h.startsWith("A")) continue
      if (basis.includes(h)) continue
      if (isZero(tableau[r][j])) continue
      if (pivotCol === -1 || (!headers[pivotCol].startsWith("X") && h.startsWith("X"))) {
        pivotCol = j
      }
    }
    if (pivotCol === -1) continue

    const pivotVal = tableau[r][pivotCol]
    for (let j = 0; j < totalCols; j++) {
      tableau[r][j] /= pivotVal
    }
    for (let i = 0; i < tableau.length; i++) {
      if (i === r) continue
      const factor = tableau[i][pivotCol]
      if (isZero(factor)) continue
      for (let j = 0; j < totalCols; j++) {
        tableau[i][j] -= factor * tableau[r][j]
      }
    }
    basis[r] = headers[pivotCol]
  }

  // Adjust zRow for the current basis (eliminate basic columns from zRow)
  for (let i = 0; i < numConstraints; i++) {
    const b = basis[i]
    const colIdx = headers.indexOf(b)
    if (colIdx >= 0 && !isZero(zRow[colIdx])) {
      const factor = zRow[colIdx]
      for (let j = 0; j < totalCols; j++) {
        zRow[j] -= factor * tableau[i][j]
      }
    }
  }

  // --- PHASE II ---
  let phase2Count = 0

  while (iteration < maxIterations) {
    const pivotCol = findPivotColumn(zRow, headers)
    const currentTable: SimplexTable = {
      headers,
      rows: tableau.slice(0, -1).map(r => [...r]),
      zRow: [...zRow],
      basis: [...basis],
      solution: tableau.map((row) => row[row.length - 1]),
    }

    if (pivotCol === -1) {
      steps.push({
        iteration,
        table: currentTable,
        isOptimal: true,
        explanation: "All coefficients in Z row are non-negative. Optimal solution reached.",
        explanationSpanish:
          "Todos los coeficientes de la fila Z son no negativos. Se ha alcanzado la solución óptima.",
      })
      break
    }

    const pivotRow = findPivotRow(tableau, pivotCol)
    if (pivotRow === -1) {
      steps.push({
        iteration,
        table: currentTable,
        isOptimal: false,
        explanation: "Problem is unbounded. No limiting constraint found.",
        explanationSpanish:
          "El problema no está acotado. No se encontró una restricción limitante.",
      })
      return {
        optimal: false, optimalValue: 0, variables: {}, slackVariables: {},
        steps, method: "SIMPLEX", iterations: phase2Count,
        status: "UNBOUNDED",
        statusExplanation:
          "El problema no está acotado. La función objetivo puede aumentar indefinidamente sin violar restricciones.",
        timeMs: performance.now() - startTime,
      }
    }

    const enteringVar = headers[pivotCol]
    const leavingVar = basis[pivotRow]
    const pivotExplanation = buildPivotExplanation(
      headers, basis, pivotCol, pivotRow, zRow, tableau, varNames, iteration
    )

    steps.push({
      iteration,
      table: currentTable,
      pivotColumn: pivotCol,
      pivotRow,
      pivotElement: tableau[pivotRow][pivotCol],
      enteringVariable: enteringVar,
      leavingVariable: leavingVar,
      explanation: pivotExplanation.en,
      explanationSpanish: pivotExplanation.es,
      isOptimal: false,
    })

    pivot(tableau, pivotRow, pivotCol, basis, headers)
    iteration++
    phase2Count++
  }

  const result = extractResult(
    tableau, basis, headers, varNames, numConstraints, isMaximization, steps, phase2Count
  )
  result.timeMs = performance.now() - startTime
  result.method = "SIMPLEX"
  return result
}

function buildPivotExplanation(
  headers: string[],
  basis: string[],
  pivotCol: number,
  pivotRow: number,
  zRow: number[],
  tableau: number[][],
  varNames: string[],
  iteration: number
): { en: string; es: string } {
  const enteringVar = headers[pivotCol]
  const leavingVar = basis[pivotRow]
  const enteringCoeff = zRow[pivotCol]

  const explanationEs = [
    `Paso ${iteration + 1}: Selección de columna pivote.`,
    `La variable ${enteringVar} tiene el coeficiente más negativo (${Math.round(enteringCoeff * 100) / 100}) en la fila Z.`,
    `Esto significa que aumentar ${enteringVar} mejora la función objetivo.`,
    `Se selecciona la fila ${pivotRow + 1} porque tiene la menor razón (${Math.round(tableau[pivotRow][headers.length - 1] / tableau[pivotRow][pivotCol] * 100) / 100}).`,
    `La variable ${leavingVar} sale de la base.`,
    `El elemento pivote es ${Math.round(tableau[pivotRow][pivotCol] * 100) / 100}.`,
  ].join(" ")

  const explanationEn = [
    `Step ${iteration + 1}: Pivot column selection.`,
    `Variable ${enteringVar} has the most negative coefficient (${Math.round(enteringCoeff * 100) / 100}) in Z row.`,
    `This means increasing ${enteringVar} improves the objective function.`,
    `Row ${pivotRow + 1} is selected because it has the minimum ratio (${Math.round(tableau[pivotRow][headers.length - 1] / tableau[pivotRow][pivotCol] * 100) / 100}).`,
    `Variable ${leavingVar} leaves the basis.`,
    `The pivot element is ${Math.round(tableau[pivotRow][pivotCol] * 100) / 100}.`,
  ].join(" ")

  return { en: explanationEn, es: explanationEs }
}

function solveDualSimplex(problem: ProblemData, startTime: number): SimplexResult {
  const { coefficients, objective, signs, values, isMaximization } = toStandardForm(problem)
  const numVars = problem.variables
  const numConstraints = problem.constraints
  const varNames = generateVariableNames(numVars)
  const slackNames = generateSlackNames(numVars, numConstraints)
  const totalCols = numVars + numConstraints + 1

  const headers: string[] = [...varNames, ...slackNames, "Solution"]
  const tableau: number[][] = []
  const basis: string[] = []

  for (let i = 0; i < numConstraints; i++) {
    const row = new Array(totalCols).fill(0)
    const multiplier = signs[i] === ">=" ? -1 : 1
    for (let j = 0; j < numVars; j++) {
      row[j] = multiplier * coefficients[i][j]
    }
    row[numVars + i] = 1
    row[totalCols - 1] = multiplier * values[i]
    tableau.push(row)
    basis.push(slackNames[i])
  }

  const zRow = new Array(totalCols).fill(0)
  for (let j = 0; j < numVars; j++) {
    zRow[j] = -objective[j]
  }
  tableau.push(zRow)

  const steps: SimplexStep[] = []
  let iteration = 0
  const maxIterations = 100

  while (iteration < maxIterations) {
    const currentZRow = tableau[tableau.length - 1]
    const currentTable: SimplexTable = {
      headers,
      rows: tableau.slice(0, -1).map(r => [...r]),
      zRow: [...zRow],
      basis: [...basis],
      solution: tableau.map((row) => row[row.length - 1]),
    }

    let pivotRow = -1
    let mostNegative = 0
    for (let i = 0; i < numConstraints; i++) {
      const rhs = tableau[i][totalCols - 1]
      if (rhs < -EPSILON && rhs < mostNegative) {
        mostNegative = rhs
        pivotRow = i
      }
    }

    if (pivotRow === -1) {
      steps.push({
        iteration,
        table: currentTable,
        isOptimal: true,
        explanation: "Dual Simplex: All RHS values are non-negative. Optimal solution reached.",
        explanationSpanish:
          "Dual Simplex: Todos los valores RHS son no negativos. Se ha alcanzado la solución óptima.",
      })
      break
    }

    let pivotCol = -1
    let minRatio = Infinity
    for (let j = 0; j < totalCols - 1; j++) {
      const a = tableau[pivotRow][j]
      if (a >= -EPSILON) continue
      const ratio = Math.abs(currentZRow[j] / a)
      if (ratio < minRatio) {
        minRatio = ratio
        pivotCol = j
      }
    }

    if (pivotCol === -1) {
      steps.push({
        iteration,
        table: currentTable,
        isOptimal: false,
        explanation: "Dual Simplex: Problem is infeasible. No negative coefficient in pivot row.",
        explanationSpanish:
          "Dual Simplex: El problema es infactible. No hay coeficiente negativo en la fila pivote.",
      })
      return {
        optimal: false, optimalValue: 0, variables: {}, slackVariables: {},
        steps, method: "SIMPLEX", iterations: iteration,
        status: "INFEASIBLE",
        statusExplanation:
          "El problema no tiene solución factible. Las restricciones son inconsistentes entre sí.",
        timeMs: performance.now() - startTime,
      }
    }

    const enteringVar = headers[pivotCol]
    const leavingVar = basis[pivotRow]

    steps.push({
      iteration,
      table: currentTable,
      pivotColumn: pivotCol,
      pivotRow,
      pivotElement: tableau[pivotRow][pivotCol],
      enteringVariable: enteringVar,
      leavingVariable: leavingVar,
      explanation:
        `Dual Simplex: Row ${pivotRow + 1} has most negative RHS (${mostNegative}). ` +
        `Variable ${enteringVar} enters to maintain dual feasibility.`,
      explanationSpanish:
        `Dual Simplex: La fila ${pivotRow + 1} tiene el RHS más negativo (${mostNegative}). ` +
        `La variable ${enteringVar} entra para mantener la factibilidad dual.`,
      isOptimal: false,
    })

    pivot(tableau, pivotRow, pivotCol, basis, headers)
    iteration++
  }

  const result = extractResult(
    tableau, basis, headers, varNames, numConstraints, isMaximization, steps, iteration
  )
  result.timeMs = performance.now() - startTime
  result.method = "DUAL_SIMPLEX"
  return result
}

function solveRelaxation(problem: ProblemData): SimplexResult {
  return solveSimplex({ ...problem, method: "BIG_M" })
}

function findMostFractional(
  varNames: string[],
  variableTypes: string[],
  variables: Record<string, number>
): { index: number; value: number } | null {
  let best: { index: number; value: number; frac: number } | null = null

  for (let i = 0; i < varNames.length; i++) {
    const type = variableTypes[i]
    if (type !== "integer" && type !== "binary") continue

    const val = variables[varNames[i]] ?? 0
    const frac = Math.abs(val - Math.round(val))

    if (frac > EPSILON && (!best || frac > best.frac)) {
      best = { index: i, value: val, frac }
    }
  }

  return best ? { index: best.index, value: best.value } : null
}

function addConstraint(
  problem: ProblemData,
  varIndex: number,
  operator: "<=" | ">=",
  value: number
): ProblemData {
  const coeffs = Array(problem.variables).fill(0)
  coeffs[varIndex] = 1

  return {
    ...problem,
    constraintsData: [
      ...problem.constraintsData,
      { coefficients: coeffs, operator, value },
    ],
    constraints: problem.constraints + 1,
  }
}

function branchAndBound(
  problem: ProblemData,
  varNames: string[],
  depth: number
): SimplexResult | null {
  const MAX_DEPTH = 50

  const result = solveRelaxation(problem)
  if (result.status === "INFEASIBLE" || result.status === "UNBOUNDED") {
    return null
  }

  const fractional = findMostFractional(varNames, problem.variableTypes, result.variables)
  if (!fractional) {
    return result
  }

  if (depth >= MAX_DEPTH) {
    return null
  }

  const { index, value } = fractional
  const varType = problem.variableTypes[index]
  const varName = varNames[index]

  let floorVal: number
  let ceilVal: number

  if (varType === "binary") {
    floorVal = 0
    ceilVal = 1
  } else {
    floorVal = Math.floor(value)
    ceilVal = Math.ceil(value)
  }

  const leftProblem = addConstraint(problem, index, "<=", floorVal)
  const leftResult = branchAndBound(leftProblem, varNames, depth + 1)

  const rightProblem = addConstraint(problem, index, ">=", ceilVal)
  const rightResult = branchAndBound(rightProblem, varNames, depth + 1)

  if (!leftResult && !rightResult) return null
  if (!leftResult) return rightResult
  if (!rightResult) return leftResult

  const isMax = problem.problemType === "MAX"
  return isMax
    ? (leftResult.optimalValue >= rightResult.optimalValue ? leftResult : rightResult)
    : (leftResult.optimalValue <= rightResult.optimalValue ? leftResult : rightResult)
}

export function solveIntegerProgramming(problem: ProblemData): SimplexResult {
  const hasIntegerVars = problem.variableTypes.some(t => t === "integer" || t === "binary")
  if (!hasIntegerVars) {
    return solveSimplex(problem)
  }

  const varNames = generateVariableNames(problem.variables)
  const startTime = performance.now()

  let modifiedProblem = { ...problem }
  const hasBinary = problem.variableTypes.some(t => t === "binary")

  if (hasBinary) {
    const newConstraints = [...problem.constraintsData]
    let extraCount = 0
    for (let i = 0; i < problem.variables; i++) {
      if (problem.variableTypes[i] === "binary") {
        const coeffs = Array(problem.variables).fill(0)
        coeffs[i] = 1
        newConstraints.push({ coefficients: coeffs, operator: "<=", value: 1 })
        extraCount++
      }
    }
    modifiedProblem = {
      ...problem,
      constraintsData: newConstraints,
      constraints: problem.constraints + extraCount,
    }
  }

  const bestResult = branchAndBound(modifiedProblem, varNames, 0)

  if (!bestResult) {
    return {
      optimal: false,
      optimalValue: 0,
      variables: {},
      slackVariables: {},
      steps: [],
      method: "INTEGER_PROGRAMMING",
      iterations: 0,
      status: "INFEASIBLE",
      statusExplanation:
        "El problema entero no tiene solución factible. Verifique las restricciones y los tipos de variables.",
      timeMs: performance.now() - startTime,
    }
  }

  bestResult.method = "INTEGER_PROGRAMMING"
  bestResult.timeMs = performance.now() - startTime
  bestResult.statusExplanation =
    "Solución óptima entera encontrada mediante Branch and Bound. Todos los valores de las variables enteras cumplen con las restricciones de integralidad."
  return bestResult
}

export function solveGraphical(problem: ProblemData): SimplexResult {
  if (problem.variables !== 2) {
    throw new Error("Graphical method requires exactly 2 variables")
  }
  return solveSimplex(problem)
}

export function solveBigM(problem: ProblemData): SimplexResult {
  return solveSimplex({ ...problem, method: "BIG_M" })
}

export function solveTwoPhase(problem: ProblemData): SimplexResult {
  return solveTwoPhaseSimplex(problem, performance.now())
}

export function autoDetectMethod(problem: ProblemData): SolveMethod {
  const hasIntegerVars = problem.variableTypes?.some(t => t === "integer" || t === "binary") ?? false
  const hasEquality = problem.constraintsData.some(r => r.operator === "=")
  const hasGreaterEqual = problem.constraintsData.some(r => r.operator === ">=")
  const hasLessEqual = problem.constraintsData.some(r => r.operator === "<=")
  const hasFreeVariable = problem.variableTypes?.includes("free") ?? false

  if (hasIntegerVars) {
    return "INTEGER_PROGRAMMING"
  }
  if (hasGreaterEqual && !hasLessEqual && !hasEquality && problem.problemType === "MIN") {
    return "DUAL_SIMPLEX"
  }
  if (hasGreaterEqual || hasEquality) {
    return "TWO_PHASE"
  }
  if (hasFreeVariable) {
    return "BIG_M"
  }
  return "SIMPLEX"
}

export function solveProblem(problem: ProblemData): SimplexResult {
  let method = problem.method
  if (!method || method === "AUTO") {
    method = autoDetectMethod(problem)
  }
  const startTime = performance.now()
  let result: SimplexResult

  if (method === "GRAPHICAL") {
    result = solveGraphical(problem)
  } else if (method === "BIG_M") {
    result = solveBigM(problem)
  } else if (method === "TWO_PHASE") {
    result = solveTwoPhaseSimplex(problem, startTime)
  } else if (method === "DUAL_SIMPLEX") {
    result = solveDualSimplex(problem, startTime)
  } else if (method === "INTEGER_PROGRAMMING") {
    result = solveIntegerProgramming(problem)
  } else {
    result = solveSimplex({ ...problem, method })
  }

  result.method = method
  return result
}

function removeArtificialsFromBasis(
  headers: string[],
  rows: number[][],
  basis: string[],
  solution: number[]
): void {
  const numRows = rows.length
  const cols = headers.length

  for (let r = 0; r < numRows; r++) {
    if (!basis[r].startsWith("A")) continue
    if (!isZero(solution[r])) continue

    let pivotCol = -1
    for (let j = 0; j < cols - 1; j++) {
      if (j === cols - 1) continue
      const h = headers[j]
      if (h.startsWith("A")) continue
      if (basis.includes(h)) continue
      if (isZero(rows[r][j])) continue
      if (pivotCol === -1 || (!headers[pivotCol].startsWith("X") && h.startsWith("X"))) {
        pivotCol = j
      }
    }
    if (pivotCol === -1) continue

    const pivot = rows[r][pivotCol]
    for (let j = 0; j < cols; j++) {
      rows[r][j] /= pivot
    }
    solution[r] /= pivot

    for (let i = 0; i < numRows; i++) {
      if (i === r) continue
      const factor = rows[i][pivotCol]
      if (isZero(factor)) continue
      for (let j = 0; j < cols; j++) {
        rows[i][j] -= factor * rows[r][j]
      }
      solution[i] -= factor * solution[r]
    }

    basis[r] = headers[pivotCol]
  }
}

export function calculateSensitivity(result: SimplexResult, problem: ProblemData): SensitivityAnalysis {
  const lastStep = result.steps[result.steps.length - 1]
  if (!lastStep || !lastStep.isOptimal) {
    throw new Error("Se requiere una solución óptima para el análisis de sensibilidad.")
  }

  const { table } = lastStep
  const { headers, rows, zRow, basis, solution } = table

  const numVars = problem.variables
  const numConstraints = problem.constraints
  const isMaximization = problem.problemType === "MAX"
  const varNames = generateVariableNames(numVars)
  const slackNames = generateSlackNames(numVars, numConstraints)

  // Remove artificial variables from the basis (degenerate at value 0)
  // to allow proper sensitivity analysis with the original objective.
  const hadArtificialBasis = basis.some((b) => b.startsWith("A"))
  removeArtificialsFromBasis(headers, rows, basis, solution)

  const totalCols = headers.length

  // After removing artificials, also pivot degenerate structural variables (value=0)
  // out of the basis, preferring to bring in non-basic slack variables.
  // This produces dual prices that match LINDO (slack basic → dual=0 for that constraint).
  for (let r = 0; r < rows.length; r++) {
    if (!isZero(solution[r])) continue          // skip non-degenerate (value ≠ 0)
    const bv = basis[r]
    if (bv.startsWith("H") || bv.startsWith("A")) continue  // only pivot X vars out

    // Try to pivot in any non-basic slack variable
    let pivotCol = -1
    for (let j = 0; j < totalCols - 1; j++) {
      if (basis.includes(headers[j])) continue  // skip basic columns
      if (!headers[j].startsWith("H")) continue
      if (isZero(rows[r][j])) continue
      if (pivotCol === -1) pivotCol = j
    }
    if (pivotCol === -1) continue

    // Degenerate pivot: entering variable enters at value 0, obj doesn't change
    const pivotVal = rows[r][pivotCol]
    for (let j = 0; j < totalCols; j++) {
      rows[r][j] /= pivotVal
    }
    solution[r] /= pivotVal
    for (let i = 0; i < rows.length; i++) {
      if (i === r) continue
      const factor = rows[i][pivotCol]
      if (isZero(factor)) continue
      for (let j = 0; j < totalCols; j++) {
        rows[i][j] -= factor * rows[r][j]
      }
      solution[i] -= factor * solution[r]
    }
    basis[r] = headers[pivotCol]

    // Also update zRow so entering variable has reduced cost 0
    if (!isZero(zRow[pivotCol])) {
      const factor = zRow[pivotCol]
      for (let j = 0; j < totalCols; j++) {
        zRow[j] -= factor * rows[r][j]
      }
    }
  }

  // Rebuild a clean zRow when artificials were present, since the original
  // zRow is contaminated with M penalty terms (or stale after pivoting them out).
  let activeZRow = zRow
  if (hadArtificialBasis) {
    const cleanZRow = new Array(totalCols).fill(0)
    for (let j = 0; j < totalCols - 1; j++) {
      const h = headers[j]
      const match = h.match(/^X(\d+)$/)
      if (match) {
        const varIdx = parseInt(match[1]) - 1
        if (varIdx >= 0 && varIdx < numVars) {
          cleanZRow[j] = isMaximization ? -problem.objective[varIdx] : problem.objective[varIdx]
        }
      }
    }
    for (let i = 0; i < basis.length; i++) {
      const b = basis[i]
      const colIdx = headers.indexOf(b)
      if (colIdx >= 0 && !isZero(cleanZRow[colIdx])) {
        const factor = cleanZRow[colIdx]
        for (let j = 0; j < totalCols; j++) {
          cleanZRow[j] -= factor * rows[i][j]
        }
      }
    }
    activeZRow = cleanZRow
  }

  const basicColIndices = new Set<number>()
  for (const bv of basis) {
    const idx = headers.indexOf(bv)
    if (idx !== -1) basicColIndices.add(idx)
  }

  const objCoeffs: SensitivityCoefficient[] = []

  for (let v = 0; v < numVars; v++) {
    const varName = varNames[v]
    const colIdx = headers.indexOf(varName)
    if (colIdx === -1) continue

    const currentValue = problem.objective[v]
    const isBasic = basicColIndices.has(colIdx)

    let allowIncrease: number
    let allowDecrease: number

    if (isBasic) {
      const rowIdx = basis.indexOf(varName)
      let maxInc = Infinity
      let maxDec = Infinity

      for (let j = 0; j < headers.length - 1; j++) {
        if (basicColIndices.has(j)) continue
        if (headers[j].startsWith("A")) continue
        if (activeZRow[j] < -EPSILON) continue

        const y_rj = rows[rowIdx][j]
        const rc = activeZRow[j]

        if (isZero(y_rj)) continue

        if (y_rj > EPSILON) {
          const bound = rc / y_rj
          if (bound < maxDec) maxDec = bound
        } else {
          const bound = rc / (-y_rj)
          if (bound < maxInc) maxInc = bound
        }
      }

      if (isMaximization) {
        allowIncrease = maxInc
        allowDecrease = maxDec
      } else {
        allowIncrease = maxDec
        allowDecrease = maxInc
      }
    } else {
      const rc = Math.max(0, activeZRow[colIdx])
      if (isMaximization) {
        allowIncrease = rc
        allowDecrease = Infinity
      } else {
        allowIncrease = Infinity
        allowDecrease = rc
      }
    }

    objCoeffs.push({
      variable: varName,
      currentValue,
      allowIncrease,
      allowDecrease,
      isBasic,
    })
  }

  const constraintValues: SensitivityConstraint[] = []

  for (let i = 0; i < numConstraints; i++) {
    const slackCol = headers.indexOf(slackNames[i])
    if (slackCol === -1) continue

    const currentValue = problem.constraintsData[i]?.value || 0
    const slackValue = result.slackVariables[slackNames[i]] ?? 0
    const isBinding = isZero(slackValue)

    let allowIncrease = Infinity
    let allowDecrease = Infinity

    for (let r = 0; r < rows.length; r++) {
      const bInv_ri = rows[r][slackCol]
      const xB_r = solution[r]

      if (isZero(bInv_ri)) continue

      if (bInv_ri > EPSILON) {
        const bound = xB_r / bInv_ri
        if (problem.constraintsData[i]?.operator === ">=") {
          if (bound < allowIncrease) allowIncrease = bound
        } else {
          if (bound < allowDecrease) allowDecrease = bound
        }
      } else {
        const bound = xB_r / (-bInv_ri)
        if (problem.constraintsData[i]?.operator === ">=") {
          if (bound < allowDecrease) allowDecrease = bound
        } else {
          if (bound < allowIncrease) allowIncrease = bound
        }
      }
    }

    let dualPrice = activeZRow[slackCol]
    if (!isMaximization) {
      const op = problem.constraintsData[i]?.operator
      if (op === ">=") dualPrice = -dualPrice
    }

    constraintValues.push({
      constraint: `Restricción ${i + 1}`,
      currentValue,
      allowIncrease,
      allowDecrease,
      dualPrice,
      isBinding,
    })
  }

  const bindingConstraints = constraintValues.filter((c) => c.isBinding).map((c) => c.constraint)

  return {
    objectiveCoefficients: objCoeffs,
    constraintValues,
    bindingConstraints,
    slackValues: result.slackVariables,
    dualPrices: Object.fromEntries(constraintValues.map(c => [c.constraint, c.dualPrice])),
  }
}

export function generateExercise(
  variables: number,
  constraints: number,
  difficulty: string
): ProblemData {
  const isMaximization = Math.random() > 0.5
  const objective: number[] = []
  for (let i = 0; i < variables; i++) {
    objective.push(Math.floor(Math.random() * 90) + 10)
  }

  const constraintsData: ConstraintRow[] = []
  for (let i = 0; i < constraints; i++) {
    const coeffs: number[] = []
    for (let j = 0; j < variables; j++) {
      coeffs.push(Math.floor(Math.random() * 20) + 1)
    }
    const operators: ("<=" | ">=" | "=")[] = ["<=", ">=", "="]
    const operator = operators[Math.floor(Math.random() * (difficulty === "BEGINNER" ? 1 : 3))]
    constraintsData.push({
      coefficients: coeffs,
      operator,
      value: Math.floor(Math.random() * 200) + 50,
    })
  }

  return {
    title: "Ejercicio Generado",
    problemType: isMaximization ? "MAX" : "MIN",
    method: "AUTO",
    variables,
    constraints,
    objective,
    constraintsData,
    variableTypes: ["positive"],
  }
}

export function getGraphData(problem: ProblemData, result: SimplexResult) {
  if (problem.variables !== 2) return null
  const lines = problem.constraintsData.map((row, i) => {
    const a = row.coefficients[0]
    const b = row.coefficients[1]
    const c = row.value
    let x1 = 0
    let y1 = 0
    let x2 = 0
    let y2 = 0
    if (Math.abs(b) > EPSILON) {
      x1 = 0
      y1 = c / b
      x2 = c / a
      y2 = 0
    } else {
      x1 = c / a
      y1 = 0
      x2 = c / a
      y2 = 100
    }
    return { label: `${a}X₁ + ${b}X₂ ${row.operator} ${c}`, x1, y1, x2, y2 }
  })

  const varNames = generateVariableNames(problem.variables)
  const v1 = varNames[0]
  const v2 = varNames[1]

  const feasibleRegion = [
    { x: 0, y: 0 },
    { x: result.variables[v1] || 0, y: 0 },
    { x: result.variables[v1] || 0, y: result.variables[v2] || 0 },
    { x: 0, y: result.variables[v2] || 0 },
  ]

  const optimalPoint = {
    x: result.variables[v1] || 0,
    y: result.variables[v2] || 0,
    label: `Óptimo (${Math.round((result.variables[v1] || 0) * 100) / 100}, ${Math.round((result.variables[v2] || 0) * 100) / 100})`,
  }

  const objX = problem.objective[0] || 1
  const objY = problem.objective[1] || 1
  const optVal = result.optimalValue
  let ox1 = 0
  let oy1 = optVal / objY
  let ox2 = optVal / objX
  let oy2 = 0

  return {
    constraints: lines,
    feasibleRegion,
    optimalPoint,
    objectiveLine: { x1: ox1, y1: oy1, x2: ox2, y2: oy2 },
    intersections: [optimalPoint],
  }
}

export function compareScenarios(
  base: SimplexResult,
  scenario: SimplexResult,
  baseName: string,
  scenarioName: string
) {
  const diff = {
    optimalValueDiff: scenario.optimalValue - base.optimalValue,
    optimalValuePercent: base.optimalValue !== 0
      ? ((scenario.optimalValue - base.optimalValue) / Math.abs(base.optimalValue)) * 100
      : 0,
    baseOptimalValue: base.optimalValue,
    scenarioOptimalValue: scenario.optimalValue,
    baseName,
    scenarioName,
  }
  return diff
}
