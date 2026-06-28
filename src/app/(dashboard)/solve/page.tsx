"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  DollarSign,
  GitBranch,
  Info,
  Play,
  Settings2,
  StepForward,
  Target,
  TrendingUp,
  Zap,
  XCircle,
} from "lucide-react"
import { solveProblem } from "@/services/simplex"
import { getCurrentProblem, getCurrentResult, setCurrentProblem, setCurrentResult, saveProblem } from "@/lib/store"
import { formatNumber } from "@/utils/format"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { FileDown, FileText, FileSpreadsheet, Download, Minus, Plus, Package, Truck, TrendingDown, Users, Eye } from "lucide-react"
import type { SimplexResult, SimplexStep, SimplexTable, ProblemData } from "@/types"

const methodLabels: Record<string, string> = {
  GRAPHICAL: "Método Gráfico",
  SIMPLEX: "Método Simplex",
  INTEGER_PROGRAMMING: "Programación Lineal Entera",
  DUAL_SIMPLEX: "Simplex Dual",
  BIG_M: "Método Gran M",
  TWO_PHASE: "Método de Dos Fases",
  AUTO: "Automático",
}

const statusLabels: Record<string, string> = {
  OPTIMAL: "Óptimo",
  UNBOUNDED: "No Acotado",
  INFEASIBLE: "No Factible",
  MULTIPLE: "Múltiples Soluciones",
  DEGENERATE: "Degenerado",
}

const statusIcons: Record<string, typeof CheckCircle2> = {
  OPTIMAL: CheckCircle2,
  UNBOUNDED: TrendingUp,
  INFEASIBLE: XCircle,
  MULTIPLE: GitBranch,
  DEGENERATE: AlertTriangle,
}

const statusColors: Record<string, string> = {
  OPTIMAL: "text-emerald-500",
  UNBOUNDED: "text-orange-500",
  INFEASIBLE: "text-red-500",
  MULTIPLE: "text-blue-500",
  DEGENERATE: "text-amber-500",
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

const formatValue = (v: number) =>
  Math.abs(v) < 1e-10 ? "0" : Number.isInteger(v) ? v.toString() : v.toFixed(4)

export default function SolvePage() {
  const router = useRouter()
  const [result, setResult] = useState<SimplexResult | null>(null)
  const problem = getCurrentProblem()
  const [steps, setSteps] = useState<SimplexStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1)
  const [stepByStep, setStepByStep] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedResult = getCurrentResult()
    if (savedResult) {
      setResult(savedResult)
    }
  }, [])

  const runSolve = useCallback((useSteps: boolean) => {
    setError(null)
    setLoading(true)
    const problem: ProblemData | null = getCurrentProblem()
    if (!problem) {
      setError("No hay un problema definido. Defina un problema primero.")
      setLoading(false)
      return
    }
    try {
      const simplexResult: SimplexResult = solveProblem(problem)
      setCurrentResult(simplexResult)
      setResult(simplexResult)
      if (useSteps) {
        setSteps(simplexResult.steps ?? [])
        setCurrentStepIndex(0)
        setStepByStep(true)
        setShowSteps(true)
      } else {
        setSteps([])
        setCurrentStepIndex(-1)
        setStepByStep(false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al resolver el problema")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("solve") === "1") {
      runSolve(false)
    }
  }, [runSolve])

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }, [steps.length])

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const currentStep: SimplexStep | null =
    stepByStep && currentStepIndex >= 0 && currentStepIndex < steps.length
      ? steps[currentStepIndex]
      : null

  if (!result) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3"
        >
          <Button onClick={() => runSolve(false)} disabled={loading} className="gap-2">
            <Play className="h-4 w-4" />
            Resolver
          </Button>
          <Button onClick={() => runSolve(false)} disabled={loading} variant="outline" className="gap-2">
            <Zap className="h-4 w-4" />
            Resolver Automáticamente
          </Button>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Zap className="h-8 w-8 text-muted-foreground" />
              </motion.div>
              <span className="ml-3 text-muted-foreground">Resolviendo...</span>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <Card>
            <CardContent className="flex flex-col items-center text-center py-16 gap-4">
              <Zap className="size-12 text-muted-foreground" />
              <div>
                <CardTitle className="text-xl mb-1">Sin resolver</CardTitle>
                <p className="text-muted-foreground text-sm">
                  No hay un problema resuelto. Define un problema y presiona "Guardar y Resolver".
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const slackEntries = Object.entries(result.slackVariables ?? {})
  const variableEntries = Object.entries(result.variables ?? {})
  const bindingConstraints = slackEntries
    .filter(([, value]) => Math.abs(value) < 1e-10)
    .map(([key]) => key)

  const StatusIcon = statusIcons[result.status] ?? Info

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="results"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Resultados</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Resultado de la optimización del problema
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {methodLabels[result.method] ?? result.method}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {result.iterations ?? "—"} iteraciones
            </Badge>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => runSolve(true)} variant="secondary" className="gap-2">
            <StepForward className="h-4 w-4" />
            Paso a Paso
          </Button>
          <Button onClick={() => router.push("/sensitivity")} variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Análisis de Sensibilidad
          </Button>
          <ParametersDialog
            problem={problem}
            onResolve={(updated) => {
              setCurrentProblem(updated)
              saveProblem(updated)
              setResult(null)
              setCurrentResult(null)
              runSolve(false)
            }}
          />
          <ExportDialog problem={problem} result={result} />
          <Button onClick={() => { setResult(null); setCurrentResult(null); runSolve(false) }} variant="ghost" className="gap-2">
            <Zap className="h-4 w-4" />
            Re-resolver
          </Button>
        </div>

        {/* Step-by-step section */}
        {showSteps && steps.length > 0 && currentStep && (
          <motion.div
            key={`step-${currentStepIndex}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Paso {currentStepIndex + 1} de {steps.length}
                    </CardTitle>
                    <CardDescription>
                      {currentStep.explanation ?? "Iteración del método Simplex"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Iteración {(currentStep.iteration ?? currentStepIndex) + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStep.pivotColumn !== undefined && currentStep.pivotRow !== undefined && (
                  <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                    <p><strong>Columna pivote:</strong> columna {currentStep.pivotColumn + 1} (índice {currentStep.pivotColumn})</p>
                    <p><strong>Fila pivote:</strong> fila {currentStep.pivotRow + 1} (índice {currentStep.pivotRow})</p>
                    {currentStep.pivotElement !== undefined && (
                      <p><strong>Elemento pivote:</strong> {formatValue(currentStep.pivotElement)}</p>
                    )}
                  </div>
                )}
                {currentStep.table && (
                  <SimplexTableView
                    table={currentStep.table}
                    pivotColumn={currentStep.pivotColumn}
                    pivotRow={currentStep.pivotRow}
                  />
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep} disabled={currentStepIndex === 0}>
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentStepIndex + 1} / {steps.length}
                </span>
                <Button onClick={nextStep} disabled={currentStepIndex === steps.length - 1}>
                  Siguiente
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* Optimal Value */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="size-5 text-primary" />
              Valor Óptimo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatNumber(result.optimalValue)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {problem?.problemType === "MAX"
                ? "Esta es la mayor ganancia posible respetando todas las restricciones"
                : "Este es el menor costo posible respetando todas las restricciones"}
            </p>
          </CardContent>
        </Card>

        {/* Variables */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="size-5 text-primary" />
              Variables Óptimas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variable</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variableEntries.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell>{formatNumber(value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {variableEntries.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                Estos son los valores que deben tomar las variables para alcanzar el valor óptimo.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Slack / Resources */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="size-5 text-primary" />
              Recursos Utilizados y Remanentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slackEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay información de recursos disponible.</p>
            ) : (
              <div className="space-y-3">
                {slackEntries.map(([key, value]) => {
                  const isBinding = Math.abs(value) < 1e-10
                  return (
                    <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">{key.replace("H", "Recurso ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {isBinding
                            ? "Este recurso se ha consumido por completo"
                            : `Quedan ${formatNumber(value)} unidades disponibles`}
                        </p>
                      </div>
                      <Badge variant={isBinding ? "destructive" : "secondary"} className="text-xs">
                        {isBinding ? "Agotado" : `${formatNumber(value)} restante`}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Binding Constraints */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="size-5 text-primary" />
              Restricciones Vinculantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bindingConstraints.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {bindingConstraints.map((key) => (
                    <Badge key={key} variant="outline" className="text-sm">
                      {key.replace("H", "Restricción ")}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Estas restricciones limitan activamente la solución. Si alguna cambiara, el valor óptimo se vería afectado.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ninguna restricción está limitando activamente la solución.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Time & Method */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              Tiempo y Método
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Método utilizado</p>
                <p className="font-semibold mt-1">{methodLabels[result.method] ?? result.method}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Tiempo de ejecución</p>
                <p className="font-semibold mt-1">{formatTime(result.timeMs)}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Iteraciones</p>
                <p className="font-semibold mt-1">{result.iterations ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="font-semibold mt-1">{statusLabels[result.status] ?? result.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <StatusIcon className={`size-5 ${statusColors[result.status] ?? ""}`} />
              Estado de la Solución
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{result.statusExplanation ?? "Solución encontrada correctamente."}</p>
            {!result.optimal && (
              <div className="flex items-start gap-2 mt-3 rounded-lg bg-amber-50 dark:bg-amber-950 p-3">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {result.status === "UNBOUNDED"
                    ? "La función objetivo no tiene límite. Revisa las restricciones del problema."
                    : result.status === "INFEASIBLE"
                      ? "No existe una solución que cumpla todas las restricciones. Revisa los datos ingresados."
                      : "La solución encontrada puede requerir revisión adicional."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Valor óptimo</span>
                <span className="font-semibold">{formatNumber(result.optimalValue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Variables</span>
                <span className="font-semibold">{variableEntries.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Restricciones vinculantes</span>
                <span className="font-semibold">{bindingConstraints.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Método</span>
                <span className="font-semibold">{methodLabels[result.method] ?? result.method}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Tiempo</span>
                <span className="font-semibold">{formatTime(result.timeMs)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

const constraintIcons = [Package, Truck, Clock, Users, Cpu]

const constraintLabels = [
  "Demanda máxima",
  "Materia prima",
  "Horas disponibles",
  "Cantidad de operarios",
  "Capacidad de máquinas",
]

function getConstraintLabel(index: number): string {
  return index < constraintLabels.length
    ? constraintLabels[index]
    : `Restricción ${index + 1}`
}

function ParamControl({
  label,
  value,
  step,
  onChange,
  icon: Icon,
}: {
  label: string
  value: number
  step: number
  onChange: (v: number) => void
  icon?: React.ElementType
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-muted-foreground shrink-0" />}
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => onChange(+(value - step).toFixed(4))}
          >
            <Minus className="size-3" />
          </Button>
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) onChange(v)
            }}
            className="w-20 h-8 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button
            variant="outline"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => onChange(+(value + step).toFixed(4))}
          >
            <Plus className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatModel(problem: ProblemData): string[] {
  const lines: string[] = []
  const label = problem.problemType === "MAX" ? "Maximizar" : "Minimizar"
  const objTerms = problem.objective.map(
    (c, i) => `${c >= 0 && i > 0 ? "+ " : c < 0 ? "- " : ""}${Math.abs(c)}x${i + 1}`
  )
  lines.push(`${label}: Z = ${objTerms.join(" ")}`)
  lines.push("Sujeto a:")
  for (const c of problem.constraintsData) {
    const terms = c.coefficients.map(
      (coef, j) => `${coef >= 0 && j > 0 ? "+ " : coef < 0 ? "- " : ""}${Math.abs(coef)}x${j + 1}`
    )
    lines.push(`  ${terms.join(" ")} ${c.operator} ${c.value}`)
  }
  for (let i = 0; i < problem.variables; i++) {
    const t = problem.variableTypes[i]
    if (t === "positive") lines.push(`  x${i + 1} ≥ 0`)
    else if (t === "integer") lines.push(`  x${i + 1} ≥ 0, entero`)
    else if (t === "binary") lines.push(`  x${i + 1} ∈ {0, 1}`)
    else if (t === "free") lines.push(`  x${i + 1} libre`)
  }
  return lines
}

function ParametersDialog({
  problem,
  onResolve,
}: {
  problem: ProblemData | null
  onResolve: (updated: ProblemData) => void
}) {
  const [local, setLocal] = useState<ProblemData | null>(null)

  useEffect(() => {
    setLocal(problem ? JSON.parse(JSON.stringify(problem)) : null)
  }, [problem])

  if (!local) return null

  const updateObjective = (i: number, v: number) => {
    setLocal((prev) => prev ? { ...prev, objective: prev.objective.map((c, j) => j === i ? v : c) } : null)
  }

  const updateConstraintValue = (i: number, v: number) => {
    setLocal((prev) => prev ? {
      ...prev,
      constraintsData: prev.constraintsData.map((c, j) => j === i ? { ...c, value: v } : c),
    } : null)
  }

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline" className="gap-2" />}
      >
        <Settings2 className="h-4 w-4" />
        Parámetros
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Parámetros del Problema</DialogTitle>
          <DialogDescription>
            Ajusta los coeficientes y recursos del modelo de optimización
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-2 max-h-[65vh] overflow-y-auto">
          {/* Ganancias / Función Objetivo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="size-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Ganancias</h4>
                <p className="text-xs text-muted-foreground">
                  Coeficientes de la función objetivo
                </p>
              </div>
            </div>
            {local.objective.map((coef, i) => (
              <ParamControl
                key={`obj-${i}`}
                label={`Producto ${i + 1} (x${i + 1})`}
                value={coef}
                step={1}
                onChange={(v) => updateObjective(i, v)}
                icon={DollarSign}
              />
            ))}
          </div>

          {/* Costos */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
                <TrendingDown className="size-4 text-red-500" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Costos</h4>
                <p className="text-xs text-muted-foreground">
                  Costos asociados a cada variable de decisión
                </p>
              </div>
            </div>
            {local.objective.map((_, i) => (
              <ParamControl
                key={`cost-${i}`}
                label={`Costo Producto ${i + 1} (x${i + 1})`}
                value={0}
                step={1}
                onChange={() => {}}
                icon={TrendingDown}
              />
            ))}
            <p className="text-xs text-muted-foreground">
              Los costos se manejan como parte del modelo. Ajusta las ganancias si el problema es de maximización.
            </p>
          </div>

          {/* Restricciones */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
                <Package className="size-4 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Restricciones</h4>
                <p className="text-xs text-muted-foreground">
                  Recursos disponibles — modifica los valores límite
                </p>
              </div>
            </div>
            {local.constraintsData.map((c, i) => {
              const Icon = constraintIcons[i] ?? Package
              return (
                <div key={`con-${i}`} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center mt-0.5 shrink-0">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{getConstraintLabel(i)}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                        {c.coefficients
                          .map((coef, j) =>
                            `${coef >= 0 && j > 0 ? "+ " : coef < 0 ? "- " : ""}${Math.abs(coef)}x${j + 1}`
                          )
                          .join(" ")}{" "}
                        {c.operator} {c.value}
                      </p>
                    </div>
                  </div>
                  <ParamControl
                    label="Valor del recurso"
                    value={c.value}
                    step={1}
                    onChange={(v) => updateConstraintValue(i, v)}
                  />
                </div>
              )
            })}
          </div>

          {/* Vista Previa */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="size-4 text-primary" />
              <h4 className="text-sm font-medium">Vista Previa del Modelo</h4>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed bg-background rounded p-3 border">
              {formatModel(local).join("\n")}
            </pre>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t">
          <DialogClose
            render={<Button variant="outline" />}
          >
            Cancelar
          </DialogClose>
          <DialogClose
            render={<Button onClick={() => onResolve(local)} />}
          >
            Aplicar y Re-resolver
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ExportDialog({
  problem,
  result,
}: {
  problem: ProblemData | null
  result: SimplexResult | null
}) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExportPDF = useCallback(async () => {
    if (!problem || !result) return
    setExporting("pdf")
    try {
      const { default: jsPDF } = await import("jspdf")
      const doc = new jsPDF()
      const pageW = doc.internal.pageSize.getWidth()
      let y = 20

      doc.setFontSize(18)
      doc.text("Informe de Optimización", pageW / 2, y, { align: "center" })
      y += 12

      doc.setFontSize(11)
      doc.text(`Título: ${problem.title}`, 14, y)
      y += 7
      doc.text(`Tipo: ${problem.problemType === "MAX" ? "Maximización" : "Minimización"}`, 14, y)
      y += 7
      doc.text(`Método: ${problem.method}`, 14, y)
      y += 10

      doc.setFontSize(14)
      doc.text("Función Objetivo", 14, y)
      y += 8
      doc.setFontSize(10)
      const objStr = problem.objective.map((c, i) => `${c >= 0 ? "+" : ""}${c}x${i + 1}`).join(" ")
      doc.text(`Z = ${objStr.replace(/^\+/, "")}`, 14, y)
      y += 10

      doc.setFontSize(14)
      doc.text("Restricciones", 14, y)
      y += 8
      doc.setFontSize(10)
      for (const row of problem.constraintsData) {
        const rowStr = row.coefficients.map((c, i) => `${c >= 0 ? "+" : ""}${c}x${i + 1}`).join(" ").replace(/^\+/, "") + ` ${row.operator} ${row.value}`
        doc.text(rowStr, 14, y)
        y += 6
        if (y > 270) { doc.addPage(); y = 20 }
      }
      y += 6

      doc.setFontSize(14)
      doc.text("Resultados", 14, y)
      y += 8
      doc.setFontSize(11)
      doc.text(`Valor Óptimo: ${formatNumber(result.optimalValue)}`, 14, y)
      y += 8
      doc.text(`Estado: ${statusLabels[result.status] ?? result.status}`, 14, y)
      y += 8
      doc.text(`Iteraciones: ${result.iterations}`, 14, y)
      y += 8
      doc.text(`Tiempo: ${result.timeMs} ms`, 14, y)
      y += 10

      doc.setFontSize(12)
      doc.text("Variables Óptimas", 14, y)
      y += 8
      doc.setFontSize(10)
      for (const [key, value] of Object.entries(result.variables)) {
        doc.text(`${key} = ${formatNumber(value)}`, 14, y)
        y += 6
      }
      y += 6

      if (result.slackVariables && Object.keys(result.slackVariables).length > 0) {
        doc.setFontSize(12)
        doc.text("Holguras (Slack)", 14, y)
        y += 8
        doc.setFontSize(10)
        for (const [key, value] of Object.entries(result.slackVariables)) {
          doc.text(`${key} = ${formatNumber(value)}`, 14, y)
          y += 6
        }
      }

      doc.save(`informe-optimizacion-${Date.now()}.pdf`)
    } catch {} finally {
      setExporting(null)
    }
  }, [problem, result])

  const handleExportCSV = useCallback(() => {
    if (!result) return
    setExporting("csv")
    try {
      const headers = ["Variable", "Valor"]
      const varRows = Object.entries(result.variables).map(([k, v]) => `${k},${v}`)
      const slackRows = Object.entries(result.slackVariables ?? {}).map(([k, v]) => `${k},${v}`)
      const meta = [
        "Optimo,Resultado",
        `Valor Óptimo,${result.optimalValue}`,
        `Estado,${statusLabels[result.status] ?? result.status}`,
        `Iteraciones,${result.iterations}`,
      ]
      const csv = [...meta, "", headers.join(","), ...varRows, "", "Holgura,Valor", ...slackRows].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `resultados-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(null)
    }
  }, [result])

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline" className="gap-2" />}
      >
        <FileDown className="h-4 w-4" />
        Exportar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Resultados</DialogTitle>
          <DialogDescription>
            Elige el formato para exportar los datos del problema
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div
            className="flex items-center justify-between rounded-lg border p-4 hover:shadow-sm transition-shadow cursor-pointer"
            onClick={handleExportPDF}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">PDF</p>
                <p className="text-xs text-muted-foreground">Informe completo del problema</p>
              </div>
            </div>
            <Button size="sm" disabled={exporting === "pdf"}>
              {exporting === "pdf" ? "..." : <Download className="size-4" />}
            </Button>
          </div>

          <div
            className="flex items-center justify-between rounded-lg border p-4 hover:shadow-sm transition-shadow cursor-pointer"
            onClick={handleExportCSV}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileSpreadsheet className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">CSV</p>
                <p className="text-xs text-muted-foreground">Valores separados por comas</p>
              </div>
            </div>
            <Button size="sm" disabled={exporting === "csv"}>
              {exporting === "csv" ? "..." : <Download className="size-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SimplexTableView({
  table,
  pivotColumn,
  pivotRow,
}: {
  table: SimplexTable
  pivotColumn?: number
  pivotRow?: number
}) {
  const headers = table.headers ?? []
  const data = table.rows ?? []

  if (data.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h: string, i: number) => (
              <TableHead key={i} className={i === pivotColumn ? "bg-primary/15 font-bold" : ""}>
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: number[], r: number) => (
            <TableRow key={r} className={r === pivotRow ? "bg-muted/60 font-semibold" : ""}>
              {row.map((cell: number, c: number) => (
                <TableCell
                  key={c}
                  className={
                    c === pivotColumn && r === pivotRow
                      ? "bg-primary/20 font-bold"
                      : c === pivotColumn
                        ? "bg-primary/10"
                        : r === pivotRow
                          ? "bg-muted/40"
                          : ""
                  }
                >
                  {cell % 1 === 0 ? cell : cell.toFixed(4)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
