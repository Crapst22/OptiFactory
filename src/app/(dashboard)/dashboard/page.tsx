"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, BookOpen, Settings, BarChart3, Play } from "lucide-react"
import { motion } from "framer-motion"
import { getSavedProblems, setCurrentProblem } from "@/lib/store"
import type { ProblemData } from "@/types"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const STORAGE_RESULTS_KEY = "optifactory-results"
const statusLabels: Record<string, string> = {
  OPTIMAL: "Óptimo",
  UNBOUNDED: "No Acotado",
  INFEASIBLE: "No Factible",
  MULTIPLE: "Múltiples Soluciones",
  DEGENERATE: "Degenerado",
}

export default function DashboardPage() {
  const router = useRouter()
  const [recentProblems, setRecentProblems] = useState<ProblemData[]>([])

  useEffect(() => {
    const all = getSavedProblems()
    setRecentProblems(all.slice(-3).reverse())
  }, [])

  const handleResolve = (p: ProblemData) => {
    setCurrentProblem(p)
    router.push("/solve?solve=1")
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">OptiFactory</h1>
        <p className="text-muted-foreground mt-1">
          Plataforma de optimización de operaciones y programación lineal
        </p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/problems/new">
          <Card className="group cursor-pointer hover:border-primary/50 transition-colors h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <PlusCircle className="size-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Nuevo Problema</CardTitle>
                <CardDescription>Crear y resolver un nuevo modelo</CardDescription>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/exercises">
          <Card className="group cursor-pointer hover:border-primary/50 transition-colors h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900 transition-colors">
                <BookOpen className="size-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Biblioteca</CardTitle>
                <CardDescription>Ejercicios clasificados por nivel</CardDescription>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/problems">
          <Card className="group cursor-pointer hover:border-primary/50 transition-colors h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 transition-colors">
                <BarChart3 className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">Problemas</CardTitle>
                <CardDescription>Ver modelos guardados</CardDescription>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings">
          <Card className="group cursor-pointer hover:border-primary/50 transition-colors h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                <Settings className="size-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-base">Configuración</CardTitle>
                <CardDescription>Personaliza tu experiencia</CardDescription>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Problemas resueltos recientemente</CardTitle>
            <CardDescription>
              {recentProblems.length === 0
                ? "Aún no has resuelto ningún problema"
                : "Tus últimos problemas resueltos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentProblems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="size-12 mx-auto mb-3 opacity-50" />
                <p>Aún no hay problemas resueltos</p>
                <p className="text-sm">Crea tu primer problema para empezar</p>
                <Link href="/problems/new">
                  <Button className="mt-4" size="sm">
                    <PlusCircle className="size-4 mr-2" />
                    Nuevo Problema
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProblems.map((p, i) => {
                  const saved = localStorage.getItem(`${STORAGE_RESULTS_KEY}-${p.title}`)
                  let result = null
                  try { result = saved ? JSON.parse(saved) : null } catch {}
                  return (
                    <div
                      key={`${p.title}-${i}`}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{p.title}</p>
                          {result && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {statusLabels[result.status] ?? result.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.problemType === "MAX" ? "Maximización" : "Minimización"}
                          {" — "}
                          {p.variables} variables, {p.constraints} restricciones
                          {result && ` — Z = ${result.optimalValue}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 shrink-0"
                        onClick={() => handleResolve(p)}
                      >
                        <Play className="size-3" />
                        Ver
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
