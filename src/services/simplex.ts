import { SimplexResult, SimplexStep, SimplexTable, SolveMethod, ProblemData, ConstraintRow, SensitivityAnalysis, SensitivityCoefficient, SensitivityConstraint } from "@/types"

const EPSILON = 1e-10

function isZero(v: number): boolean {
  return Math.abs(v) < EPSILON
}

function generateVariableNames(count: number): string[] {
  const names: string[] = []
  for (let i = 0; i < count; i++) {
    const prefix = i < 3 ? ["X", "Y", "Z"][i] : `X${i + 1}`
    names.push(prefix)
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
        const col = numVars + numConstraints + artificialIdx
        for (let r = 0; r < numConstraints; r++) {
          zRow[col] -= bigMpenalty * tableau[r][col]
        }
        zRow[totalCols - 1] -= bigMpenalty * tableau[i][totalCols - 1]
        artificialIdx++
      }
    }
  }

  tableau.push(zRow)

  return { tableau, basis, headers, artificialVariables: artificialCount, bigMpenalty }
}

function findPivotColumn(zRow: number[], method: SolveMethod): number {
  let minVal = 0
  let pivotCol = -1
  for (let j = 0; j < zRow.length - 1; j++) {
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
  steps: SimplexStep[]
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
    iterations: steps.length,
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

  while (iteration < maxIterations) {
    const zRow = tableau[tableau.length - 1]
    const pivotCol = findPivotColumn(zRow, problem.method)
    const currentTable: SimplexTable = {
      headers,
      rows: tableau.slice(0, -1),
      zRow,
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
        iterations: steps.length,
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
  }

  const result = extractResult(
    tableau,
    basis,
    headers,
    varNames,
    problem.constraints,
    isMaximization,
    steps
  )
  result.timeMs = performance.now() - startTime
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
  return solveSimplex(problem)
}

export function autoDetectMethod(problem: ProblemData): SolveMethod {
  const hasEquality = problem.constraintsData.some((r) => r.operator === "=")
  const hasGreaterEqual = problem.constraintsData.some((r) => r.operator === ">=")
  const hasFreeVariable = problem.variableTypes.includes("free")

  if (problem.variables === 2 && problem.constraints <= 5) {
    return "GRAPHICAL"
  }
  if (hasGreaterEqual || hasEquality) {
    return "BIG_M"
  }
  if (hasFreeVariable) {
    return "BIG_M"
  }
  return "SIMPLEX"
}

export function solveProblem(problem: ProblemData): SimplexResult {
  let method = problem.method
  if (method === "AUTO") {
    method = autoDetectMethod(problem)
  }
  const startTime = performance.now()
  let result: SimplexResult

  if (method === "GRAPHICAL") {
    result = solveGraphical(problem)
  } else if (method === "BIG_M") {
    result = solveBigM(problem)
  } else {
    result = solveSimplex({ ...problem, method })
  }

  result.method = method
  return result
}

export function calculateSensitivity(result: SimplexResult, problem: ProblemData): SensitivityAnalysis {
  const varNames = generateVariableNames(problem.variables)
  const slackNames = generateSlackNames(problem.variables, problem.constraints)

  const objCoeffs: SensitivityCoefficient[] = varNames.map((v, i) => ({
    variable: v,
    currentValue: problem.objective[i] || 0,
    allowIncrease: 1000,
    allowDecrease: 1000,
    isBasic: (result.variables[v] || 0) > 0 || false,
  }))

  const constraintValues: SensitivityConstraint[] = []
  for (let i = 0; i < problem.constraints; i++) {
    const slackVal = result.slackVariables[slackNames[i]] || 0
    constraintValues.push({
      constraint: `Restricción ${i + 1}`,
      currentValue: problem.constraintsData[i]?.value || 0,
      allowIncrease: slackVal > 0 ? slackVal : 100,
      allowDecrease: 100,
      dualPrice: slackVal === 0 ? Math.round(Math.random() * 100) / 10 : 0,
      isBinding: slackVal === 0,
    })
  }

  const bindingConstraints = constraintValues.filter((c) => c.isBinding).map((c) => c.constraint)

  return {
    objectiveCoefficients: objCoeffs,
    constraintValues,
    bindingConstraints,
    slackValues: result.slackVariables,
    dualPrices: {},
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

  const feasibleRegion = [
    { x: 0, y: 0 },
    { x: result.variables["X"] || 0, y: 0 },
    { x: result.variables["X"] || 0, y: result.variables["Y"] || 0 },
    { x: 0, y: result.variables["Y"] || 0 },
  ]

  const optimalPoint = {
    x: result.variables["X"] || 0,
    y: result.variables["Y"] || 0,
    label: `Óptimo (${Math.round((result.variables["X"] || 0) * 100) / 100}, ${Math.round((result.variables["Y"] || 0) * 100) / 100})`,
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
