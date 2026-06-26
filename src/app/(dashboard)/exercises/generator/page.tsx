"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FlaskConical, Shuffle, Play, ArrowRight } from "lucide-react"
import { generateExercise, solveProblem } from "@/services/simplex"
import { setCurrentProblem } from "@/lib/store"
import type { ProblemData, SimplexResult } from "@/types"

const difficultyOptions = [
  { value: "BEGINNER", label: "Principiante" },
  { value: "INTERMEDIATE", label: "Intermedio" },
  { value: "ADVANCED", label: "Avanzado" },
] as const

const typeOptions = [
  { value: "MAX", label: "Maximización" },
  { value: "MIN", label: "Minimización" },
] as const

function formatModel(problem: ProblemData): string[] {
  const lines: string[] = []
  const label = problem.problemType === "MAX" ? "Maximizar" : "Minimizar"
  const objTerms = problem.objective.map(
    (c, i) =>
      `${c >= 0 && i > 0 ? "+ " : c < 0 ? "- " : ""}${Math.abs(c)}x${i + 1}`,
  )
  lines.push(`${label}: Z = ${objTerms.join(" ")}`)
  lines.push("Sujeto a:")
  for (const c of problem.constraintsData) {
    const terms = c.coefficients.map(
      (coef, j) =>
        `${coef >= 0 && j > 0 ? "+ " : coef < 0 ? "- " : ""}${Math.abs(coef)}x${j + 1}`,
    )
    lines.push(`  ${terms.join(" ")} ${c.operator} ${c.value}`)
  }
  for (let i = 0; i < problem.variables; i++) {
    lines.push(`  x${i + 1} ≥ 0`)
  }
  return lines
}

function formatNumber(v: number) {
  return Number.isInteger(v) ? v.toString() : v.toFixed(4)
}

export default function GeneratorPage() {
  const [variables, setVariables] = useState(2)
  const [constraints, setConstraints] = useState(2)
  const [difficulty, setDifficulty] = useState<string>("BEGINNER")
  const [problemType, setProblemType] = useState<string>("MAX")
  const [generated, setGenerated] = useState<ProblemData | null>(null)
  const [result, setResult] = useState<SimplexResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [solving, setSolving] = useState(false)

  function handleGenerate() {
    setLoading(true)
    setResult(null)
    try {
      const problem = generateExercise(variables, constraints, difficulty)
      const typed = { ...problem, problemType: problemType as "MAX" | "MIN" }
      setGenerated(typed)
    } finally {
      setLoading(false)
    }
  }

  function handleSolve() {
    if (!generated) return
    setSolving(true)
    try {
      const simplexResult = solveProblem(generated)
      setResult(simplexResult)
    } finally {
      setSolving(false)
    }
  }

  function handleUseProblem() {
    if (!generated) return
    setCurrentProblem(generated)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto pb-12"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Generador de Ejercicios
        </h1>
        <p className="text-muted-foreground mt-1">
          Configura los parámetros y genera un problema de programación lineal
          para practicar
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FlaskConical className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Configuración</CardTitle>
              <CardDescription>
                Define la estructura del problema a generar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Número de variables
              </Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {variables}
              </span>
            </div>
            <Slider
              value={[variables]}
              min={2}
              max={5}
              step={1}
               onValueChange={(value) => {
                 const v = Array.isArray(value) ? value[0] : value
                 setVariables(v)
                 setResult(null)
               }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Número de restricciones
              </Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {constraints}
              </span>
            </div>
            <Slider
              value={[constraints]}
              min={1}
              max={5}
              step={1}
               onValueChange={(value) => {
                 const v = Array.isArray(value) ? value[0] : value
                 setConstraints(v)
                 setResult(null)
               }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Dificultad</Label>
            <div className="flex gap-2">
              {difficultyOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setDifficulty(opt.value)
                    setResult(null)
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    difficulty === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo</Label>
            <div className="flex gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setProblemType(opt.value)
                    setResult(null)
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    problemType === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full gap-2"
            size="lg"
          >
            <Shuffle className="size-4" />
            {loading ? "Generando..." : "Generar"}
          </Button>
        </CardFooter>
      </Card>

      {generated && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                  <FlaskConical className="size-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Problema Generado</CardTitle>
                  <CardDescription>
                    {generated.variables} variables, {generated.constraints}{" "}
                    restricciones &middot;{" "}
                    {difficultyOptions.find((d) => d.value === difficulty)
                      ?.label ?? difficulty}{" "}
                    &middot;{" "}
                    {typeOptions.find((t) => t.value === problemType)?.label ??
                      problemType}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                  {formatModel(generated).join("\n")}
                </pre>
              </div>

              {result && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 space-y-3"
                >
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Resultado
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      Z = {formatNumber(result.optimalValue)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {Object.entries(result.variables).map(([key, val]) => (
                        <Badge key={key} variant="secondary" className="text-sm">
                          {key} = {formatNumber(val)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    {result.statusExplanation}
                  </div>
                </motion.div>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              {!result ? (
                <Button
                  onClick={handleSolve}
                  disabled={solving}
                  className="gap-2"
                >
                  <Play className="size-4" />
                  {solving ? "Resolviendo..." : "Resolver"}
                </Button>
              ) : (
                <Button
                  onClick={handleUseProblem}
                  variant="default"
                  className="gap-2"
                >
                  <ArrowRight className="size-4" />
                  Usar este problema
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
