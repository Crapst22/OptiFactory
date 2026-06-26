"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Save, FolderOpen, Trash2, Plus } from "lucide-react"
import { getCurrentProblem, setCurrentProblem } from "@/lib/store"
import type { ProblemData } from "@/types"

interface SavedScenario {
  id: string
  name: string
  description: string
  problem: ProblemData
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "optifactory-scenarios"

function loadScenarios(): SavedScenario[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistScenarios(scenarios: SavedScenario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
}

export default function ScenariosPage() {
  const router = useRouter()
  const [scenarios, setScenarios] = useState<SavedScenario[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setScenarios(loadScenarios())
    setMounted(true)
  }, [])

  const currentProblem = getCurrentProblem()

  const handleSave = useCallback(() => {
    const problem = getCurrentProblem()
    if (!problem || !name.trim()) return

    const now = new Date().toISOString()
    const newScenario: SavedScenario = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      problem,
      createdAt: now,
      updatedAt: now,
    }

    const updated = [newScenario, ...loadScenarios()]
    persistScenarios(updated)
    setScenarios(updated)
    setName("")
    setDescription("")
    setDialogOpen(false)
  }, [name, description])

  const handleLoad = useCallback(
    (scenario: SavedScenario) => {
      setCurrentProblem(scenario.problem)
      router.push("/problems")
    },
    [router]
  )

  const handleDelete = useCallback((id: string) => {
    const updated = loadScenarios().filter((s) => s.id !== id)
    persistScenarios(updated)
    setScenarios(updated)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Escenarios</h1>
          <p className="text-sm text-muted-foreground">
            Guarda y gestiona diferentes configuraciones de problemas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="gap-2" disabled={!currentProblem} />}>
            <Save className="h-4 w-4" />
            Guardar Escenario
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guardar Escenario</DialogTitle>
              <DialogDescription>
                Guarda el problema actual como un escenario para cargarlo
                despu&eacute;s.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  placeholder="Nombre del escenario"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Descripci&oacute;n
                </label>
                <Input
                  placeholder="Descripci&oacute;n opcional"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!name.trim()}>
                <Save className="h-4 w-4" />
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {scenarios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              No hay escenarios guardados
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              Guarda el problema actual para crear tu primer escenario.
            </p>
            <Button
              className="gap-2"
              disabled={!currentProblem}
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Crear Escenario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <motion.div
                key={scenario.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    {scenario.description && (
                      <CardDescription>
                        {scenario.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {scenario.problem.problemType === "MAX"
                          ? "Maximizar"
                          : "Minimizar"}
                      </Badge>
                      <Badge variant="outline">
                        {scenario.problem.variables} vars
                      </Badge>
                      <Badge variant="outline">
                        {scenario.problem.constraints} restr.
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Creado:{" "}
                      {new Date(scenario.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleLoad(scenario)}
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      Cargar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(scenario.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
