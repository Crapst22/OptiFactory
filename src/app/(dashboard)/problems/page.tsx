"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Brain, Trash2, Play, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { getSavedProblems, setCurrentProblem, deleteSavedProblem } from "@/lib/store"
import type { ProblemData } from "@/types"

const methodLabels: Record<string, string> = {
  AUTO: "Automático",
  SIMPLEX: "Simplex",
  GRAPHICAL: "Gráfico",
  DUAL_SIMPLEX: "Dual Simplex",
  BIG_M: "Big M",
  TWO_PHASE: "Dos Fases",
}

export default function ProblemsPage() {
  const router = useRouter()
  const [problems, setProblems] = useState<ProblemData[]>([])

  useEffect(() => {
    setProblems(getSavedProblems())
  }, [])

  const handleLoad = (p: ProblemData) => {
    setCurrentProblem(p)
    router.push("/solve")
  }

  const handleDelete = (title: string) => {
    deleteSavedProblem(title)
    setProblems(getSavedProblems())
  }

  const objectiveStr = (p: ProblemData) => {
    const label = p.problemType === "MAX" ? "Max" : "Min"
    const terms = p.objective.map((c, i) => `${c}x${i + 1}`).join(" + ")
    return `${label} Z = ${terms}`
  }

  if (problems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Problemas</h1>
            <p className="text-muted-foreground mt-1">
              Tus modelos de programación lineal
            </p>
          </div>
          <Link href="/problems/new">
            <Button>
              <Plus className="size-4 mr-2" />
              Nuevo Problema
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="size-12 mx-auto mb-4 text-muted-foreground/50" />
            <CardTitle className="text-lg mb-2">No hay problemas guardados</CardTitle>
            <CardDescription className="mb-6">
              Crea tu primer problema para empezar a optimizar
            </CardDescription>
            <Link href="/problems/new">
              <Button>
                <Plus className="size-4 mr-2" />
                Crear Problema
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Problemas</h1>
          <p className="text-muted-foreground mt-1">
            Tus modelos de programación lineal
          </p>
        </div>
        <Link href="/problems/new">
          <Button>
            <Plus className="size-4 mr-2" />
            Nuevo Problema
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {problems.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{p.title}</CardTitle>
                    <CardDescription className="mt-1 font-mono text-xs">
                      {objectiveStr(p)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {p.variables}v / {p.constraints}r
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {methodLabels[p.method] ?? p.method}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-2" onClick={() => handleLoad(p)}>
                    <Play className="size-3" />
                    Resolver
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => handleDelete(p.title)}>
                    <Trash2 className="size-3 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
