"use client"

import { useState, useCallback } from "react"
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
import { Play, StepForward, GitCompare, Zap, BarChart3, TrendingUp } from "lucide-react"
import { solveProblem } from "@/services/simplex"
import { getCurrentProblem, setCurrentResult } from "@/lib/store"
import type { SimplexResult, SimplexStep, SimplexTable, ProblemData } from "@/types"

export default function SolvePage() {
  const router = useRouter()
  const [result, setResult] = useState<SimplexResult | null>(null)
  const [steps, setSteps] = useState<SimplexStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1)
  const [stepByStep, setStepByStep] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSolve = useCallback((useSteps: boolean) => {
    setError(null)
    setLoading(true)
    setStepByStep(useSteps)

    try {
      const problem: ProblemData | null = getCurrentProblem()
      if (!problem) {
        setError("No hay un problema definido. Defina un problema primero.")
        setLoading(false)
        return
      }

      const simplexResult: SimplexResult = solveProblem(problem)
      setCurrentResult(simplexResult)
      setResult(simplexResult)

      if (useSteps) {
        setSteps(simplexResult.steps ?? [])
        setCurrentStepIndex(0)
      } else {
        setSteps([])
        setCurrentStepIndex(-1)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al resolver el problema")
    } finally {
      setLoading(false)
    }
  }, [])

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

  const formatNumber = (v: number) =>
    Number.isInteger(v) ? v.toString() : v.toFixed(4)

  const formatValue = (v: number) =>
    Math.abs(v) < 1e-10 ? "0" : formatNumber(v)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-3"
      >
        <Button
          onClick={() => runSolve(false)}
          disabled={loading}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          Resolver
        </Button>
        <Button
          onClick={() => runSolve(true)}
          disabled={loading}
          variant="secondary"
          className="gap-2"
        >
          <StepForward className="h-4 w-4" />
          Paso a Paso
        </Button>
        <Button
          onClick={() => runSolve(false)}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Resolver Automáticamente
        </Button>
        <Button
          onClick={() => router.push("/comparison")}
          variant="ghost"
          className="gap-2"
        >
          <GitCompare className="h-4 w-4" />
          Comparar
        </Button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
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
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Zap className="h-8 w-8 text-muted-foreground" />
            </motion.div>
            <span className="ml-3 text-muted-foreground">
              Resolviendo...
            </span>
          </CardContent>
        </Card>
      )}

      <AnimatePresence mode="wait">
        {result && !stepByStep && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Resultado Óptimo</CardTitle>
                <CardDescription>
                  Valor óptimo de la función objetivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {result.optimalValue !== undefined
                    ? formatValue(result.optimalValue)
                    : "—"}
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/results")}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Ver Resultados Detallados
              </Button>
              <Button
                onClick={() => router.push("/sensitivity")}
                variant="secondary"
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Análisis de Sensibilidad
              </Button>
            </div>

            {result.variables && result.variables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Variables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.variables).map(([key, val], i) => (
                      <Badge key={i} variant="secondary" className="text-sm">
                        {key} = {formatValue(val)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {stepByStep && steps.length > 0 && currentStep && (
          <motion.div
            key={`step-${currentStepIndex}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
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
                    Iteración {currentStep.iteration ?? currentStepIndex + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStep.pivotColumn !== undefined && currentStep.pivotRow !== undefined && (
                  <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                    <p>
                      <strong>Columna pivote:</strong>{" "}
                      columna {currentStep.pivotColumn + 1} (índice{" "}
                      {currentStep.pivotColumn})
                    </p>
                    <p>
                      <strong>Fila pivote:</strong>{" "}
                      fila {currentStep.pivotRow + 1} (índice{" "}
                      {currentStep.pivotRow})
                    </p>
                    {currentStep.pivotElement !== undefined && (
                      <p>
                        <strong>Elemento pivote:</strong>{" "}
                        {formatValue(currentStep.pivotElement)}
                      </p>
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
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentStepIndex + 1} / {steps.length}
                </span>
                <Button
                  onClick={nextStep}
                  disabled={currentStepIndex === steps.length - 1}
                >
                  Siguiente
                </Button>
              </CardFooter>
            </Card>

            {currentStepIndex === steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Solución Óptima</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">
                      Z ={" "}
                      {result?.optimalValue !== undefined
                        ? formatValue(result.optimalValue)
                        : "—"}
                    </p>
                    {result?.variables && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(result.variables).map(([key, val], i) => (
                          <Badge key={i} variant="secondary" className="text-sm">
                            {key} = {formatValue(val)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
              <TableHead
                key={i}
                className={
                  i === pivotColumn ? "bg-primary/15 font-bold" : ""
                }
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row: number[], r: number) => (
            <TableRow
              key={r}
              className={
                r === pivotRow ? "bg-muted/60 font-semibold" : ""
              }
            >
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
