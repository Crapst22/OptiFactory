"use client"

import { useState, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import {
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Minus,
  Plus,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { InfoTooltip } from "@/components/ui/info-tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { getCurrentProblem, getCurrentResult } from "@/lib/store"
import { calculateSensitivity, solveProblem } from "@/services/simplex"
import { setCurrentResult } from "@/lib/store"
import type {
  SensitivityAnalysis,
  SensitivityCoefficient,
  SensitivityConstraint,
  ProblemData,
  SimplexResult,
} from "@/types"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

function formatNum(v: number): string {
  return Math.abs(v) < 1e-10 ? "0" : Number.isInteger(v) ? v.toString() : v.toFixed(4)
}

export default function SensitivityPage() {
  const problem = useMemo(() => getCurrentProblem(), [])
  const result = useMemo(() => getCurrentResult(), [])

  const sensitivity = useMemo<SensitivityAnalysis | null>(() => {
    if (!problem || !result) return null
    try {
      return calculateSensitivity(result, problem)
    } catch {
      return null
    }
  }, [problem, result])

  const [editingCoeffs, setEditingCoeffs] = useState<Record<string, number>>({})
  const [editingRHS, setEditingRHS] = useState<Record<string, number>>({})
  const [whatIfResult, setWhatIfResult] = useState<SimplexResult | null>(null)
  const [whatIfError, setWhatIfError] = useState<string | null>(null)

  const handleCoeffChange = useCallback((variable: string, value: number) => {
    setEditingCoeffs((prev) => ({ ...prev, [variable]: value }))
    setWhatIfResult(null)
    setWhatIfError(null)
  }, [])

  const handleRHSChange = useCallback((constraint: string, value: number) => {
    setEditingRHS((prev) => ({ ...prev, [constraint]: value }))
    setWhatIfResult(null)
    setWhatIfError(null)
  }, [])

  const runWhatIf = useCallback(() => {
    if (!problem) return
    setWhatIfError(null)

    try {
      const newProblem: ProblemData = {
        ...problem,
        objective: problem.objective.map((v, i) => {
          const varName = ["X", "Y", "Z"][i] || `X${i + 1}`
          return editingCoeffs[varName] !== undefined ? editingCoeffs[varName] : v
        }),
        constraintsData: problem.constraintsData.map((row, i) => {
          const key = `R${i + 1}`
          return {
            ...row,
            value: editingRHS[key] !== undefined ? editingRHS[key] : row.value,
          }
        }),
      }

      const newResult = solveProblem(newProblem)
      setWhatIfResult(newResult)
    } catch (e) {
      setWhatIfError(e instanceof Error ? e.message : "Error al resolver el escenario")
    }
  }, [problem, editingCoeffs, editingRHS])

  const resetWhatIf = useCallback(() => {
    setEditingCoeffs({})
    setEditingRHS({})
    setWhatIfResult(null)
    setWhatIfError(null)
  }, [])

  const diffProfit = useMemo(() => {
    if (!whatIfResult || !result) return null
    return whatIfResult.optimalValue - result.optimalValue
  }, [whatIfResult, result])

  if (!problem || !result) {
    return (
      <div className="flex items-center justify-center py-24">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="size-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No hay un problema resuelto. Resuelva un problema primero para ver el análisis de sensibilidad.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sensitivity) {
    return (
      <div className="flex items-center justify-center py-24">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="size-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No se pudo calcular el análisis de sensibilidad.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto space-y-8 pb-12"
    >
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Análisis de Sensibilidad</h1>
        <p className="text-muted-foreground mt-1">
          Evalúa cómo los cambios en coeficientes y recursos afectan la solución óptima.
        </p>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-emerald-500" />
              Coeficientes de la Función Objetivo
            </CardTitle>
            <CardDescription>
              Rango de variación permisible para cada coeficiente sin cambiar la base óptima.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variable</TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Valor Actual
                      <InfoTooltip text="El valor que tiene actualmente el coeficiente de la variable en la función objetivo." />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Disminución Permisible
                      <InfoTooltip text="Cuánto puede bajar el valor de la variable sin que cambie la solución óptima." />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Aumento Permisible
                      <InfoTooltip text="Cuánto puede aumentar el valor de la variable sin cambiar la solución óptima." />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Rango
                      <InfoTooltip text="El rango de valores que puede tomar el coeficiente de la variable sin afectar la solución óptima." />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Estado
                      <InfoTooltip text="Indica si la variable pertenece a la solución óptima (su valor es distinto de 0)." />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sensitivity.objectiveCoefficients.map((coeff: SensitivityCoefficient) => {
                  const lower = coeff.currentValue - coeff.allowDecrease
                  const upper = coeff.currentValue + coeff.allowIncrease
                  return (
                    <TableRow key={coeff.variable}>
                      <TableCell className="font-medium">
                        {coeff.variable}
                      </TableCell>
                      <TableCell>{formatNum(coeff.currentValue)}</TableCell>
                      <TableCell className="text-red-500">
                        {formatNum(coeff.allowDecrease)}
                      </TableCell>
                      <TableCell className="text-emerald-500">
                        {formatNum(coeff.allowIncrease)}
                      </TableCell>
                      <TableCell>
                        [{formatNum(lower)}, {formatNum(upper)}]
                      </TableCell>
                      <TableCell>
                        {coeff.isBasic ? (
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                            <CheckCircle2 className="size-3 mr-1" />
                            SÍ
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            NO
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="size-5 text-blue-500" />
              Restricciones y Precios Sombra
            </CardTitle>
            <CardDescription>
              Límites de recursos, precio sombra por unidad extra, y restricciones activas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restricción</TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Valor Actual (RHS)
                      <InfoTooltip text="Cantidad de recurso disponible actualmente." />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Disminución Permisible
                      <InfoTooltip text="Cuánto puede disminuir este recurso sin que la solución óptima cambie." />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Aumento Permisible
                      <InfoTooltip text="Cuánto puede aumentar este recurso sin que la solución óptima cambie." />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Rango
                      <InfoTooltip text="El rango de valores en el que puede variar la cantidad de recurso sin afectar la solución óptima." />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Precio Sombra
                      <InfoTooltip text="El valor económico de tener una unidad adicional de este recurso." />
                    </span>
                  </TableHead>
                  <TableHead>
                    <span className="inline-flex items-center gap-1">
                      Estado
                      <InfoTooltip text="Indica si el recurso se consume en su totalidad y limita la solución actual." />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sensitivity.constraintValues.map((c: SensitivityConstraint) => {
                  const lower = c.currentValue - c.allowDecrease
                  const upper = c.currentValue + c.allowIncrease
                  return (
                    <TableRow key={c.constraint}>
                      <TableCell className="font-medium">
                        {c.constraint}
                      </TableCell>
                      <TableCell>{formatNum(c.currentValue)}</TableCell>
                      <TableCell className="text-red-500">
                        {formatNum(c.allowDecrease)}
                      </TableCell>
                      <TableCell className="text-emerald-500">
                        {formatNum(c.allowIncrease)}
                      </TableCell>
                      <TableCell>
                        [{formatNum(lower)}, {formatNum(upper)}]
                      </TableCell>
                      <TableCell>
                        {c.dualPrice !== 0 ? (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {formatNum(c.dualPrice)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.isBinding ? (
                          <Badge variant="default" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            <AlertTriangle className="size-3 mr-1" />
                            SÍ
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Minus className="size-3 mr-1" />
                            NO
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {sensitivity.bindingConstraints.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-4" />
                Restricciones Activas (Binding)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sensitivity.bindingConstraints.map((bc) => (
                  <Badge key={bc} variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-400">
                    {bc}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Estas restricciones limitan la solución actual. Un cambio en su lado derecho modifica el valor óptimo.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-5 text-violet-500" />
              Simulación &quot;Qué Pasa Si&quot;
            </CardTitle>
            <CardDescription>
              Modifica coeficientes o recursos y resuelve para ver el nuevo resultado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Coeficientes de la Función Objetivo
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {problem.objective.map((v, i) => {
                  const varName = ["X", "Y", "Z"][i] || `X${i + 1}`
                  const currentVal = editingCoeffs[varName] ?? v
                  return (
                    <div key={varName} className="space-y-1">
                      <Label htmlFor={`coeff-${varName}`} className="text-xs text-muted-foreground">
                        {varName} (actual: {formatNum(v)})
                      </Label>
                      <Input
                        id={`coeff-${varName}`}
                        type="number"
                        step="any"
                        value={currentVal}
                        onChange={(e) => handleCoeffChange(varName, Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">
                Lado Derecho de Restricciones (RHS)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {problem.constraintsData.map((row, i) => {
                  const key = `R${i + 1}`
                  const currentVal = editingRHS[key] ?? row.value
                  return (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={`rhs-${key}`} className="text-xs text-muted-foreground">
                        R{i + 1} (actual: {formatNum(row.value)})
                      </Label>
                      <Input
                        id={`rhs-${key}`}
                        type="number"
                        step="any"
                        value={currentVal}
                        onChange={(e) => handleRHSChange(key, Number(e.target.value))}
                        className="h-9"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={runWhatIf} className="gap-2">
                <Plus className="size-4" />
                Evaluar Escenario
              </Button>
              <Button onClick={resetWhatIf} variant="outline" className="gap-2">
                Restablecer
              </Button>
            </div>

            {whatIfError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {whatIfError}
              </div>
            )}

            {whatIfResult && result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 rounded-lg border bg-card p-4"
              >
                <h4 className="font-semibold text-base">Resultado del Escenario</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Valor Original</p>
                    <p className="text-lg font-bold">{formatNum(result.optimalValue)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Nuevo Valor</p>
                    <p className="text-lg font-bold">{formatNum(whatIfResult.optimalValue)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Diferencia</p>
                    <p
                      className={`text-lg font-bold flex items-center gap-1 ${
                        diffProfit === null
                          ? ""
                          : diffProfit > 0
                            ? "text-emerald-600"
                            : diffProfit < 0
                              ? "text-red-600"
                              : ""
                      }`}
                    >
                      {diffProfit === null ? (
                        "—"
                      ) : diffProfit > 0 ? (
                        <>
                          <TrendingUp className="size-4" />
                          +{formatNum(diffProfit)}
                        </>
                      ) : diffProfit < 0 ? (
                        <>
                          <TrendingDown className="size-4" />
                          {formatNum(diffProfit)}
                        </>
                      ) : (
                        "0"
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Cambio Porcentual</p>
                    <p
                      className={`text-lg font-bold ${
                        diffProfit === null || result.optimalValue === 0
                          ? ""
                          : diffProfit > 0
                            ? "text-emerald-600"
                            : diffProfit < 0
                              ? "text-red-600"
                              : ""
                      }`}
                    >
                      {diffProfit === null || result.optimalValue === 0
                        ? "—"
                        : `${(diffProfit / Math.abs(result.optimalValue) * 100).toFixed(2)}%`}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Variables de Decisión</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(whatIfResult.variables).map(([varName, val]) => {
                      const origVal = result.variables[varName] ?? 0
                      const diff = val - origVal
                      return (
                        <Badge
                          key={varName}
                          variant="secondary"
                          className={`text-sm ${
                            diff > 0
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : diff < 0
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                                : ""
                          }`}
                        >
                          {varName} = {formatNum(val)}
                          {diff !== 0 && (
                            <span className={`ml-1 ${diff > 0 ? "text-emerald-500" : "text-red-500"}`}>
                              ({diff > 0 ? "+" : ""}{formatNum(diff)})
                            </span>
                          )}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                {whatIfResult.status !== "OPTIMAL" && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2">
                    <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                    <span>{whatIfResult.statusExplanation || "El problema no tiene una solución óptima factible."}</span>
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
