export type ProblemType = "MAX" | "MIN"
export type SolveMethod = "GRAPHICAL" | "SIMPLEX" | "DUAL_SIMPLEX" | "BIG_M" | "TWO_PHASE" | "INTEGER_PROGRAMMING" | "AUTO"
export type VariableType = "positive" | "integer" | "binary" | "free"
export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
export type Operator = "<=" | ">=" | "="

export interface ProblemData {
  id?: string
  title: string
  problemType: ProblemType
  method: SolveMethod
  variables: number
  constraints: number
  objective: number[]
  constraintsData: ConstraintRow[]
  variableTypes: VariableType[]
}

export interface ConstraintRow {
  coefficients: number[]
  operator: Operator
  value: number
}

export interface SimplexStep {
  iteration: number
  table: SimplexTable
  pivotColumn?: number
  pivotRow?: number
  pivotElement?: number
  enteringVariable?: string
  leavingVariable?: string
  explanation: string
  explanationSpanish: string
  isOptimal: boolean
}

export interface SimplexTable {
  headers: string[]
  rows: number[][]
  basis: string[]
  zRow: number[]
  solution: number[]
}

export interface SimplexResult {
  optimal: boolean
  optimalValue: number
  variables: Record<string, number>
  slackVariables: Record<string, number>
  steps: SimplexStep[]
  method: SolveMethod
  iterations: number
  status: "OPTIMAL" | "UNBOUNDED" | "INFEASIBLE" | "MULTIPLE" | "DEGENERATE"
  statusExplanation: string
  timeMs: number
}

export interface SensitivityAnalysis {
  objectiveCoefficients: SensitivityCoefficient[]
  constraintValues: SensitivityConstraint[]
  bindingConstraints: string[]
  slackValues: Record<string, number>
  dualPrices: Record<string, number>
}

export interface SensitivityCoefficient {
  variable: string
  currentValue: number
  allowIncrease: number
  allowDecrease: number
  isBasic: boolean
}

export interface SensitivityConstraint {
  constraint: string
  currentValue: number
  allowIncrease: number
  allowDecrease: number
  dualPrice: number
  isBinding: boolean
}

export interface ComparisonData {
  scenarios: ScenarioResult[]
}

export interface ScenarioResult {
  name: string
  optimalValue: number
  variables: Record<string, number>
  bindingConstraints: string[]
  slackValues: Record<string, number>
}

export interface ProblemSettings {
  title: string
  problemType: ProblemType
  method: SolveMethod
  variables: number
  constraints: number
}

export interface AppConfig {
  theme: "light" | "dark" | "system"
  language: "es" | "en"
  precision: number
  defaultMethod: SolveMethod
  animations: boolean
  autoDetectMethod: boolean
}

export interface Exercise {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  problemType: ProblemType
  objective: number[]
  constraints: ConstraintRow[]
  solution: { values: string; optimalZ: string }
  steps: string[]
  isEnunciado?: boolean
}

export interface PlotPoint {
  x: number
  y: number
  label?: string
}

export interface GraphData {
  constraints: {
    label: string
    x1: number
    y1: number
    x2: number
    y2: number
  }[]
  feasibleRegion: PlotPoint[]
  optimalPoint: PlotPoint
  objectiveLine: { x1: number; y1: number; x2: number; y2: number }
  intersections: PlotPoint[]
}

export interface ParameterConfig {
  id: string
  label: string
  key: string
  type: "input" | "slider" | "stepper"
  min?: number
  max?: number
  step?: number
  unit?: string
  section: string
}
