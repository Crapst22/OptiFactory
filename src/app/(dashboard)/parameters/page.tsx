"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
  Minus,
  Plus,
  DollarSign,
  TrendingDown,
  Package,
  Truck,
  Clock,
  Users,
  Cpu,
  Eye,
  AlertTriangle,
} from "lucide-react"
import { getCurrentProblem, setCurrentProblem } from "@/lib/store"
import type { ProblemData } from "@/types"

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

function ParamControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  icon: Icon,
}: {
  label: string
  value: number
  min: number
  max: number
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
            onClick={() => onChange(Math.max(min, +(value - step).toFixed(4)))}
            disabled={value <= min}
          >
            <Minus className="size-3" />
          </Button>
          <Input
            type="number"
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
            }}
            className="w-20 h-8 text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button
            variant="outline"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => onChange(Math.min(max, +(value + step).toFixed(4)))}
            disabled={value >= max}
          >
            <Plus className="size-3" />
          </Button>
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(value) => { const v = Array.isArray(value) ? value[0] : value; onChange(v) }}
      />
    </div>
  )
}

export default function ParametersPage() {
  const [problem, setProblemLocal] = useState<ProblemData | null>(null)

  useEffect(() => {
    setProblemLocal(getCurrentProblem())
  }, [])

  const updateProblem = useCallback(
    (updated: ProblemData) => {
      setProblemLocal(updated)
      setCurrentProblem(updated)
    },
    [],
  )

  const updateObjective = useCallback(
    (index: number, value: number) => {
      if (!problem) return
      const objective = [...problem.objective]
      objective[index] = value
      updateProblem({ ...problem, objective })
    },
    [problem, updateProblem],
  )

  const updateConstraintValue = useCallback(
    (index: number, value: number) => {
      if (!problem) return
      const constraintsData = problem.constraintsData.map((c, i) =>
        i === index ? { ...c, value } : c,
      )
      updateProblem({ ...problem, constraintsData })
    },
    [problem, updateProblem],
  )

  if (!problem) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="size-12 mx-auto text-muted-foreground" />
            <div>
              <CardTitle>Sin problema activo</CardTitle>
              <CardDescription>
                Crea o carga un problema desde el panel principal para ajustar sus parámetros.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto pb-12"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Parámetros del Problema</h1>
        <p className="text-muted-foreground mt-1">
          Ajusta los coeficientes y recursos del modelo de optimización
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Ganancias</CardTitle>
              <CardDescription>
                Coeficientes de la función objetivo — ganancia por unidad de cada producto
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {problem.objective.map((coef, i) => (
            <ParamControl
              key={`obj-${i}`}
              label={`Producto ${i + 1} (x${i + 1})`}
              value={coef}
              min={-100}
              max={100}
              step={1}
              onChange={(v) => updateObjective(i, v)}
              icon={DollarSign}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
              <TrendingDown className="size-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Costos</CardTitle>
              <CardDescription>
                Costos asociados a cada variable de decisión (si aplica)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {problem.objective.map((_, i) => (
            <ParamControl
              key={`cost-${i}`}
              label={`Costo Producto ${i + 1} (x${i + 1})`}
              value={0}
              min={0}
              max={100}
              step={1}
              onChange={() => {}}
              icon={TrendingDown}
            />
          ))}
          <p className="text-xs text-muted-foreground mt-2">
            Los costos se manejan como parte del modelo. Ajusta las ganancias si el problema es de maximización.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
              <Package className="size-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Restricciones</CardTitle>
              <CardDescription>
                Recursos disponibles — modifica los valores límite de cada restricción
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {problem.constraintsData.map((c, i) => {
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
                        .map(
                          (coef, j) =>
                            `${coef >= 0 && j > 0 ? "+ " : coef < 0 ? "- " : ""}${Math.abs(coef)}x${j + 1}`,
                        )
                        .join(" ")}{" "}
                      {c.operator} {c.value}
                    </p>
                  </div>
                </div>
                <ParamControl
                  label="Valor del recurso"
                  value={c.value}
                  min={0}
                  max={1000}
                  step={1}
                  onChange={(v) => updateConstraintValue(i, v)}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Vista Previa del Modelo</CardTitle>
              <CardDescription>
                El modelo se actualiza en tiempo real con los cambios realizados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
              {formatModel(problem).join("\n")}
            </pre>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
