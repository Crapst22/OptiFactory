"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { BookOpen, BarChart3, Lightbulb, ArrowRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { setCurrentProblem, getSavedExercises, deleteSavedExercise } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { ProblemData, ConstraintRow, Difficulty, Operator, Exercise } from "@/types"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const defaultExercises: Exercise[] = [
  {
    id: "beginner-1",
    title: "Maximización de Producción",
    description:
      "Una fábrica produce dos tipos de productos (X e Y) con recursos limitados de mano de obra y materia prima. Determine la producción óptima que maximiza las ganancias.",
    difficulty: "BEGINNER",
    problemType: "MAX",
    objective: [30, 40],
    constraints: [
      { coefficients: [2, 1], operator: "<=", value: 100 },
      { coefficients: [1, 2], operator: "<=", value: 80 },
    ],
    solution: { values: "X = 40, Y = 20", optimalZ: "Z = 30(40) + 40(20) = 2.000" },
    steps: [
      "Identificar variables de decisión: X = cantidad del producto A, Y = cantidad del producto B",
      "Función objetivo: Maximizar Z = 30X + 40Y",
      "Restricción 1: 2X + Y ≤ 100 (horas de mano de obra)",
      "Restricción 2: X + 2Y ≤ 80 (unidades de materia prima)",
      "Graficar las restricciones en el plano XY",
      "Identificar la región factible (intersección de las restricciones)",
      "Evaluar la función objetivo en los vértices de la región factible",
      "Vértice (0, 0) → Z = 0",
      "Vértice (50, 0) → Z = 1.500",
      "Vértice (0, 40) → Z = 1.600",
      "Vértice (40, 20) → Z = 30(40) + 40(20) = 2.000 ← ÓPTIMO",
      "Solución óptima: Producir 40 unidades de X y 20 unidades de Y para obtener Z = 2.000",
    ],
  },
  {
    id: "intermediate-1",
    title: "Optimización de Mezcla de Productos",
    description:
      "Una empresa produce tres productos (X, Y, Z) con limitaciones en capacidad de producción, almacenamiento y horas máquina. Encuentre la mezcla óptima de producción.",
    difficulty: "INTERMEDIATE",
    problemType: "MAX",
    objective: [50, 40, 30],
    constraints: [
      { coefficients: [1, 1, 1], operator: "<=", value: 200 },
      { coefficients: [2, 1, 0], operator: "<=", value: 150 },
      { coefficients: [0, 1, 2], operator: "<=", value: 120 },
    ],
    solution: {
      values: "X = 50, Y = 50, Z = 35",
      optimalZ: "Z = 50(50) + 40(50) + 30(35) = 5.550",
    },
    steps: [
      "Variables: X, Y, Z = unidades a producir de cada producto",
      "Maximizar Z = 50X + 40Y + 30Z",
      "Restricción 1: X + Y + Z ≤ 200 (capacidad de producción)",
      "Restricción 2: 2X + Y ≤ 150 (horas máquina disponibles)",
      "Restricción 3: Y + 2Z ≤ 120 (capacidad de almacenamiento)",
      "Resolver mediante el método Simplex",
      "Solución óptima: X = 50, Y = 50, Z = 35",
      "Valor óptimo: Z = 5.550",
    ],
  },
  {
    id: "advanced-1",
    title: "Planificación de Producción Mixta",
    description:
      "Una planta industrial debe planificar su producción considerando restricciones mixtas: límite de recursos, demanda mínima y un contrato fijo. Incluye restricciones ≤, ≥ e =.",
    difficulty: "ADVANCED",
    problemType: "MAX",
    objective: [60, 50, 40],
    constraints: [
      { coefficients: [2, 3, 1], operator: "<=", value: 300 },
      { coefficients: [1, 1, 0], operator: ">=", value: 50 },
      { coefficients: [1, 0, 1], operator: "=", value: 100 },
    ],
    solution: {
      values: "X = 62.5, Y = 25, Z = 37.5",
      optimalZ: "Z = 60(62.5) + 50(25) + 40(37.5) = 6.500",
    },
    steps: [
      "Variables: X, Y, Z = unidades producidas de cada línea",
      "Maximizar Z = 60X + 50Y + 40Z",
      "Restricción ≤: 2X + 3Y + Z ≤ 300 (recursos disponibles)",
      "Restricción ≥: X + Y ≥ 50 (demanda mínima del mercado)",
      "Restricción =: X + Z = 100 (contrato de suministro)",
      "Resolver usando método Simplex con variables de holgura y exceso",
      "La restricción de igualdad se maneja con una variable artificial",
      "Solución óptima: X = 62.5, Y = 25, Z = 37.5",
      "Valor óptimo: Z = 6.500",
    ],
  },
]

const difficultyConfig: Record<Difficulty, { label: string; color: string }> = {
  BEGINNER: { label: "Principiante", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  INTERMEDIATE: { label: "Intermedio", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  ADVANCED: { label: "Avanzado", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
}

function formatConstraint(coeffs: number[], operator: Operator, value: number, varNames: string[]): string {
  const terms = coeffs
    .map((c, i) => {
      if (c === 0) return null
      const sign = c < 0 ? "- " : (i === 0 ? "" : "+ ")
      const abs = Math.abs(c)
      const varStr = abs === 1 ? varNames[i] : `${abs}${varNames[i]}`
      return `${sign}${i === 0 && c < 0 ? "- " : ""}${i === 0 ? (c < 0 ? `${abs}${varNames[i]}` : varStr) : varStr}`
    })
    .filter(Boolean)
    .join(" ")
  return `${terms} ${operator} ${value}`
}

function formatObjective(coeffs: number[], type: "MAX" | "MIN", varNames: string[]): string {
  const terms = coeffs
    .map((c, i) => {
      if (c === 0) return null
      const sign = c < 0 ? "- " : (i === 0 ? "" : "+ ")
      const abs = Math.abs(c)
      const varStr = abs === 1 ? varNames[i] : `${abs}${varNames[i]}`
      return `${sign}${varStr}`
    })
    .filter(Boolean)
    .join(" ")
  return `${type === "MAX" ? "Max" : "Min"} Z = ${terms}`
}

function buildProblem(ex: Exercise): ProblemData {
  return {
    title: ex.title,
    problemType: ex.problemType,
    method: "AUTO",
    variables: ex.objective.length,
    constraints: ex.constraints.length,
    objective: ex.objective,
    constraintsData: ex.constraints as ConstraintRow[],
    variableTypes: ex.objective.map(() => "positive"),
  }
}

export default function ExercisesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Difficulty>("BEGINNER")
  const [solutionsVisible, setSolutionsVisible] = useState<Record<string, boolean>>({})
  const [stepsVisible, setStepsVisible] = useState<Record<string, boolean>>({})
  const [savedExercises, setSavedExercises] = useState<Exercise[]>([])

  useEffect(() => {
    setSavedExercises(getSavedExercises())
  }, [])

  const toggleSolution = (id: string) => {
    setSolutionsVisible((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleSteps = (id: string) => {
    setStepsVisible((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSolve = (ex: Exercise) => {
    setCurrentProblem(buildProblem(ex))
    router.push("/solve")
  }

  const handleDelete = (title: string) => {
    deleteSavedExercise(title)
    setSavedExercises(getSavedExercises())
  }

  const allExercises = [...defaultExercises, ...savedExercises]
  const filtered = allExercises.filter((ex) => ex.difficulty === activeTab)
  const varNames = (n: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(87 + i))

  const isSaved = (id: string) => id.startsWith("generated-")

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Ejercicios</h1>
          <p className="text-muted-foreground mt-1">
            Explora ejercicios de programación lineal clasificados por nivel de dificultad
          </p>
        </div>
        <Link href="/exercises/generator">
          <Button size="lg" className="gap-2 shrink-0">
            <BarChart3 className="size-4" />
            Generar Ejercicio
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <Tabs
          value={activeTab}
          onValueChange={(v: string | null) => v && setActiveTab(v as Difficulty)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="BEGINNER" className="gap-2">
              <BookOpen className="size-4" />
              Principiante
            </TabsTrigger>
            <TabsTrigger value="INTERMEDIATE" className="gap-2">
              <BarChart3 className="size-4" />
              Intermedio
            </TabsTrigger>
            <TabsTrigger value="ADVANCED" className="gap-2">
              <Lightbulb className="size-4" />
              Avanzado
            </TabsTrigger>
          </TabsList>

          {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as Difficulty[]).map((diff) => (
            <TabsContent key={diff} value={diff} className="mt-6 space-y-6">
              {filtered.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <BookOpen className="size-12 mb-3 opacity-50" />
                    <p>No hay ejercicios disponibles para este nivel</p>
                  </CardContent>
                </Card>
              ) : (
                filtered.map((ex) => {
                  const vars = varNames(ex.objective.length)
                  const showSol = solutionsVisible[ex.id]
                  const showSteps = stepsVisible[ex.id]
                  const diffCfg = difficultyConfig[ex.difficulty]
                  const saved = isSaved(ex.id)

                  return (
                    <motion.div
                      key={ex.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="overflow-hidden">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-xl">{ex.title}</CardTitle>
                                <Badge className={cn("font-medium", diffCfg.color)}>
                                  {diffCfg.label}
                                </Badge>
                                {saved && (
                                  <Badge variant="outline" className="text-xs">
                                    Generado
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-sm leading-relaxed">
                                {ex.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 font-mono text-sm">
                            <p className="font-semibold text-foreground">
                              {formatObjective(ex.objective, ex.problemType, vars)}
                            </p>
                            <p className="text-muted-foreground">Sujeto a:</p>
                            {ex.constraints.map((c, i) => (
                              <p key={i} className="text-foreground/85">
                                {formatConstraint(c.coefficients, c.operator, c.value, vars)}
                              </p>
                            ))}
                            <p className="text-muted-foreground">
                              {vars.map((v) => `${v} ≥ 0`).join(", ")}
                            </p>
                          </div>

                          {showSol && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2"
                            >
                              <p className="text-sm font-semibold flex items-center gap-2">
                                <Lightbulb className="size-4 text-primary" />
                                Solución Óptima
                              </p>
                              <p className="text-sm font-mono">{ex.solution.values}</p>
                              <p className="text-sm font-mono font-bold text-primary">
                                {ex.solution.optimalZ}
                              </p>

                              {showSteps && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="mt-3 pt-3 border-t border-primary/10 space-y-1"
                                >
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Paso a Paso
                                  </p>
                                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                    {ex.steps.map((step, i) => (
                                      <li key={i}>{step}</li>
                                    ))}
                                  </ol>
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </CardContent>

                        <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/20 px-6 py-3">
                          <Button onClick={() => handleSolve(ex)} className="gap-2">
                            <BarChart3 className="size-4" />
                            Resolver
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => toggleSolution(ex.id)}
                            className="gap-2"
                          >
                            <Lightbulb className="size-4" />
                            {showSol ? "Ocultar Solución" : "Ver Solución"}
                          </Button>
                          {showSol && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSteps(ex.id)}
                              className="gap-2"
                            >
                              <BookOpen className="size-4" />
                              {showSteps ? "Ocultar Pasos" : "Ver Paso a Paso"}
                            </Button>
                          )}
                          {saved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(ex.title)}
                              className="gap-2 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="size-3" />
                              Eliminar
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
