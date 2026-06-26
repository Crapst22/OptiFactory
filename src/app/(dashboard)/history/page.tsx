"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  History,
  Trash2,
  RotateCcw,
  Clock,
  FileText,
  AlertTriangle,
  SearchX,
} from "lucide-react"
import { setCurrentProblem, setCurrentResult } from "@/lib/store"
import { formatDate, formatNumber } from "@/utils/format"
import type { ProblemData, SimplexResult, SolveMethod } from "@/types"

interface HistoryEntry {
  id: string
  title: string
  date: string
  problemType: string
  method: SolveMethod
  variables: number
  constraints: number
  status?: string
  optimalValue?: number
  problemData: ProblemData
  resultData: SimplexResult | null
}

const methodLabels: Record<string, string> = {
  GRAPHICAL: "Gráfico",
  SIMPLEX: "Simplex",
  DUAL_SIMPLEX: "Simplex Dual",
  BIG_M: "Gran M",
  TWO_PHASE: "Dos Fases",
  AUTO: "Automático",
}

const statusLabels: Record<string, string> = {
  OPTIMAL: "Óptimo",
  UNBOUNDED: "No Acotado",
  INFEASIBLE: "No Factible",
  MULTIPLE: "Múltiples Soluciones",
  DEGENERATE: "Degenerado",
}

function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("optifactory-history")
    if (!stored) return []
    return JSON.parse(stored) as HistoryEntry[]
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem("optifactory-history", JSON.stringify(entries))
}

function containerVariants(delay: number) {
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: delay },
    },
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const exitVariants = {
  exit: {
    opacity: 0,
    x: -20,
    height: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: { duration: 0.2 },
  },
}

export default function HistoryPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [clearOpen, setClearOpen] = useState(false)

  useEffect(() => {
    setEntries(getHistory())
    setLoaded(true)
  }, [])

  const refresh = useCallback(() => {
    setEntries(getHistory())
  }, [])

  const handleLoad = useCallback(
    (entry: HistoryEntry) => {
      setCurrentProblem(entry.problemData)
      if (entry.resultData) {
        setCurrentResult(entry.resultData)
      }
      router.push("/solve")
    },
    [router]
  )

  const handleDelete = useCallback(
    (id: string) => {
      const updated = entries.filter((e) => e.id !== id)
      saveHistory(updated)
      setEntries(updated)
      setDeleteTarget(null)
    },
    [entries]
  )

  const handleClearAll = useCallback(() => {
    saveHistory([])
    setEntries([])
    setClearOpen(false)
  }, [])

  if (!loaded) {
    return null
  }

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto mt-12"
      >
        <Card>
          <CardContent className="flex flex-col items-center text-center py-16 gap-4">
            <SearchX className="size-14 text-muted-foreground/50" />
            <div>
              <CardTitle className="text-xl mb-1">
                Sin historial
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Aún no hay problemas guardados. Resuelve un problema y se
                guardará automáticamente en el historial.
              </p>
            </div>
            <Button onClick={() => router.push("/problems/new")}>
              <FileText className="size-4" />
              Nuevo Problema
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants(0.05)}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historial</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {entries.length}{" "}
            {entries.length === 1
              ? "problema guardado"
              : "problemas guardados"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={clearOpen} onOpenChange={setClearOpen}>
            <DialogTrigger render={<Button variant="destructive" size="sm" />}>
              <Trash2 className="size-4" />
              Limpiar todo
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Limpiar historial</DialogTitle>
                <DialogDescription>
                  Esta acción eliminará todos los problemas guardados en el
                  historial. No se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancelar
                </DialogClose>
                <Button variant="destructive" onClick={handleClearAll}>
                  <Trash2 className="size-4" />
                  Eliminar todo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            layout
          >
            <Card className="group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className="font-semibold text-base truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleLoad(entry)}
                        >
                          {entry.title}
                        </h3>
                        {entry.resultData?.status === "OPTIMAL" && (
                          <Badge
                            variant="default"
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs border-emerald-200 dark:border-emerald-800"
                          >
                            Óptimo
                          </Badge>
                        )}
                        {entry.resultData?.status &&
                          entry.resultData.status !== "OPTIMAL" && (
                            <Badge variant="secondary" className="text-xs">
                              {
                                statusLabels[
                                  entry.resultData.status
                                ]
                              }
                            </Badge>
                          )}
                        {!entry.resultData && (
                          <Badge variant="outline" className="text-xs">
                            Sin resolver
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {formatDate(entry.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <History className="size-3.5" />
                          {methodLabels[entry.method] ?? entry.method}
                        </span>
                        <span>
                          {entry.variables} var
                          {entry.variables !== 1 ? "s" : ""},{" "}
                          {entry.constraints} rest
                          {entry.constraints !== 1 ? "s" : ""}
                        </span>
                        {entry.resultData && (
                          <span className="font-medium text-foreground">
                            Z = {formatNumber(entry.resultData.optimalValue)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleLoad(entry)}
                      title="Cargar problema"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                    <Dialog
                      open={deleteTarget === entry.id}
                      onOpenChange={(open) => {
                        if (!open) setDeleteTarget(null)
                      }}
                    >
                      <DialogTrigger
                        render={
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            title="Eliminar"
                          />
                        }
                        onClick={() => setDeleteTarget(entry.id)}
                      >
                        <Trash2 className="size-4" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-5 text-destructive" />
                            Eliminar problema
                          </DialogTitle>
                          <DialogDescription>
                            ¿Estás seguro de eliminar &ldquo;{entry.title}
                            &rdquo; del historial? Esta acción no se puede
                            deshacer.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose render={<Button variant="outline" />}>
                            Cancelar
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="size-4" />
                            Eliminar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
