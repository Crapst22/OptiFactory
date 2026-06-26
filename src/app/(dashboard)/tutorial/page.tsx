"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Variable,
  ShieldCheck,
  Crosshair,
  LayoutGrid,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

const concepts = [
  {
    title: "¿Qué es Programación Lineal?",
    icon: BrainCircuit,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    description:
      "Es una técnica matemática que busca la mejor solución (óptima) para un problema modelado mediante relaciones lineales. Se usa para asignar recursos limitados de forma eficiente en industrias, transporte, logística y más.",
    example:
      'Una fábrica que produce dos productos y quiere maximizar sus ganancias sabiendo cuántas horas de máquina y materia prima tiene disponibles.',
  },
  {
    title: "Maximizar y Minimizar",
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    description:
      "Son los dos tipos de objetivo en PL. Maximizar busca el mayor valor posible (ganancias, producción, eficiencia). Minimizar busca el menor valor posible (costos, tiempo, desperdicio).",
    example:
      "Maximizar utilidades = 40x + 50y  |  Minimizar costos = 120x + 80y",
  },
  {
    title: "Variables de Decisión",
    icon: Variable,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    description:
      "Son las incógnitas del problema, representan las decisiones que podemos controlar. Generalmente se denotan con letras como x, y, z. El objetivo es encontrar sus valores óptimos.",
    example:
      "x = número de mesas a producir  |  y = número de sillas a producir",
  },
  {
    title: "Restricciones",
    icon: ShieldCheck,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    description:
      "Son las limitaciones del problema: recursos finitos, capacidad máxima, disponibilidad de materiales, etc. Se expresan como inecuaciones lineales que acotan los valores posibles de las variables.",
    example:
      "2x + y ≤ 100 (horas de mano de obra)  |  x + 3y ≤ 120 (unidades de materia prima)",
  },
  {
    title: "Función Objetivo",
    icon: Crosshair,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    description:
      "Es la expresión matemática lineal que queremos optimizar (maximizar o minimizar). Relaciona las variables de decisión con el objetivo del problema mediante coeficientes que representan contribuciones.",
    example:
      "Z = 40x + 50y  →  Z es la ganancia total, 40 y 50 son las ganancias por unidad de cada producto",
  },
  {
    title: "Región Factible",
    icon: LayoutGrid,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
    description:
      "Es el conjunto de todos los puntos que satisfacen simultáneamente todas las restricciones. Es el espacio de soluciones candidatas. Si no hay región factible, el problema es inviable.",
    example:
      "El polígono formado por la intersección de las semirrectas de cada restricción. Cualquier punto dentro cumple todas las condiciones.",
  },
  {
    title: "Solución Óptima",
    icon: Star,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/50",
    description:
      "Es el punto dentro de la región factible que produce el mejor valor de la función objetivo. Según el Teorema Fundamental de PL, la solución óptima se encuentra en un vértice del polígono factible.",
    example:
      "En el vértice (30, 20) de la región factible se obtiene Z = 40(30) + 50(20) = 2.200, el valor máximo posible.",
  },
]

const questions = [
  {
    question: "¿Qué representa la función objetivo en un problema de Programación Lineal?",
    options: [
      "El conjunto de todas las soluciones posibles",
      "La expresión matemática que se desea optimizar",
      "Los recursos disponibles para la producción",
      "Las variables que se deben determinar",
    ],
    correct: 1,
  },
  {
    question: "¿Dónde se encuentra siempre la solución óptima en un problema de PL?",
    options: [
      "En el centro de la región factible",
      "Fuera de la región factible",
      "En un vértice de la región factible",
      "Depende del tipo de restricciones",
    ],
    correct: 2,
  },
  {
    question: "¿Qué ocurre si no existe una región factible?",
    options: [
      "El problema tiene infinitas soluciones",
      "El problema es inviable (no tiene solución)",
      "La función objetivo se maximiza automáticamente",
      "Las restricciones se vuelven redundantes",
    ],
    correct: 1,
  },
]

export default function TutorialPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const correctCount = questions.reduce(
    (count, q, i) => count + (answers[i] === q.correct ? 1 : 0),
    0,
  )

  function handleSubmit() {
    setSubmitted(true)
  }

  function handleReset() {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-10 pb-12"
    >
      <motion.div variants={item} className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">
          Tutorial de Programación Lineal
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Aprende los conceptos fundamentales para modelar y resolver problemas de optimización lineal.
        </p>
      </motion.div>

      <div className="space-y-6">
        {concepts.map((c, idx) => {
          const Icon = c.icon
          const isEven = idx % 2 === 0
          return (
            <motion.div key={idx} variants={item}>
              <div
                className={cn(
                  "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-shadow hover:shadow-md",
                )}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="flex items-start gap-4 p-6 sm:w-2/5 sm:border-r border-border">
                    <div
                      className={cn(
                        "size-12 rounded-xl shrink-0 flex items-center justify-center",
                        c.bg,
                        c.color,
                      )}
                    >
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{c.title}</h2>
                      {isEven ? (
                        <TrendingDown className="size-4 text-muted-foreground mt-1" />
                      ) : null}
                    </div>
                  </div>
                  <div className="flex-1 p-6 space-y-3">
                    <p className="text-sm leading-relaxed text-foreground/85">
                      {c.description}
                    </p>
                    <div className="rounded-lg bg-muted/50 border p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Ejemplo
                      </p>
                      <p className="text-sm text-foreground/80 italic">
                        &ldquo;{c.example}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <motion.div variants={item}>
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Cuestionario</CardTitle>
            <CardDescription className="text-base">
              Pon a prueba lo que has aprendido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {questions.map((q, qi) => {
              const isCorrect = submitted && answers[qi] === q.correct
              const isWrong = submitted && answers[qi] !== undefined && answers[qi] !== q.correct
              return (
                <div key={qi} className="space-y-3">
                  <p className="font-medium">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const selected = answers[qi] === oi
                      return (
                        <button
                          key={oi}
                          type="button"
                          disabled={submitted}
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [qi]: oi }))
                          }
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all",
                            "hover:border-primary/50",
                            selected && !submitted && "border-primary bg-primary/5",
                            submitted && oi === q.correct && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
                            submitted && selected && oi !== q.correct && "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300",
                            !selected && !submitted && "border-border bg-background",
                            submitted && !selected && oi !== q.correct && "border-border opacity-60",
                          )}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span className={cn(
                              "size-5 rounded-full border-2 flex items-center justify-center text-xs font-medium shrink-0",
                              selected && !submitted && "border-primary bg-primary text-primary-foreground",
                              submitted && oi === q.correct && "border-emerald-500 bg-emerald-500 text-white",
                              submitted && selected && oi !== q.correct && "border-red-500 bg-red-500 text-white",
                              !selected && "border-muted-foreground/30",
                            )}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== questions.length}
                className="w-full"
                size="lg"
              >
                Verificar respuestas
              </Button>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-lg font-semibold">
                  {correctCount === questions.length
                    ? "¡Perfecto! Has respondido todo correctamente."
                    : `Has acertado ${correctCount} de ${questions.length} preguntas.`}
                </p>
                <Button onClick={handleReset} variant="outline">
                  Reintentar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
