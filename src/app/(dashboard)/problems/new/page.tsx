"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useProblem } from "@/hooks/use-problem"
import { setCurrentProblem, setCurrentResult, saveProblem } from "@/lib/store"
import { solveProblem } from "@/services/simplex"
import { ProblemType, VariableType, ConstraintRow } from "@/types"
import { Plus, Trash2, Copy, ArrowRight, Calculator, Brain, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AiChat } from "@/components/ai-chat"

export default function NewProblemPage() {
  const router = useRouter()
  const [chatOpen, setChatOpen] = useState(false)
  const [dirty, setDirty] = useState<Record<string, string>>({})

  const displayVal = (key: string, modelVal: number) => dirty[key] ?? String(modelVal)

  const handleNumChange = (key: string, raw: string, setter: (v: number) => void) => {
    setDirty(prev => ({ ...prev, [key]: raw }))
    if (raw === "" || raw === "-") return
    const num = parseFloat(raw)
    if (!isNaN(num)) setter(num)
  }

  const syncDirty = (key: string) => {
    setDirty(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const {
    problem,
    setTitle,
    setProblemType,
    setVariables,
    setConstraints,
    setObjective,
    setConstraintCoefficient,
    setConstraintOperator,
    setConstraintValue,
    addConstraint,
    removeConstraint,
    duplicateConstraint,
    setVariableType,
  } = useProblem()

  const varNames: string[] = []
  for (let i = 0; i < problem.variables; i++) {
    varNames.push(`X${i + 1}`)
  }

  const handleSaveAndGo = () => {
    setCurrentProblem(problem)
    saveProblem(problem)
    try {
      const result = solveProblem(problem)
      setCurrentResult(result)
      toast.success("Problema resuelto exitosamente")
    } catch {
      toast.error("El problema no pudo resolverse automáticamente")
    }
    router.push("/solve")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Problema</h1>
        <p className="text-muted-foreground mt-1">
          Define el modelo de programación lineal
        </p>
      </div>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogTrigger render={<Button variant="outline" className="w-full gap-2 h-auto min-h-12 text-sm md:text-base whitespace-normal px-3" />}>
          <Sparkles className="size-5 text-primary shrink-0" />
          <span className="text-balance">Asistente IA — describe tu problema en lenguaje natural</span>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] h-[600px] p-0 flex flex-col overflow-hidden">
          <AiChat
            onApplyProblem={(parsed) => {
              if (parsed.title) setTitle(parsed.title)
              if (parsed.problemType) setProblemType(parsed.problemType)
              if (parsed.variables) setVariables(parsed.variables)
              if (parsed.constraints) setConstraints(parsed.constraints)
              if (parsed.objective) {
                parsed.objective.forEach((coeff, i) => setObjective(i, coeff))
              }
              if (parsed.constraintsData) {
                parsed.constraintsData.forEach((row, i) => {
                  row.coefficients.forEach((coeff, j) => setConstraintCoefficient(i, j, coeff))
                  setConstraintOperator(i, row.operator)
                  setConstraintValue(i, row.value)
                })
              }
              if (parsed.variableTypes) {
                parsed.variableTypes.forEach((type, i) => setVariableType(i, type))
              }
              setChatOpen(false)
              toast.success("Parámetros aplicados correctamente")
            }}
          />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Datos Generales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título del problema</Label>
            <Input
              id="title"
              value={problem.title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Problema de producción"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Tipo de problema</Label>
              <RadioGroup
                value={problem.problemType}
                onValueChange={(v: string | null) => v && setProblemType(v as ProblemType)}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="MAX" id="max" />
                  <Label htmlFor="max">Maximización</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="MIN" id="min" />
                  <Label htmlFor="min">Minimización</Label>
                </div>
              </RadioGroup>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Cantidad de variables: {problem.variables}</Label>
              <Slider
                value={[problem.variables]}
                onValueChange={(value) => { const v = Array.isArray(value) ? value[0] : value; setVariables(v) }}
                min={2}
                max={20}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2</span>
                <span>20</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Cantidad de restricciones: {problem.constraints}</Label>
              <Slider
                value={[problem.constraints]}
                onValueChange={(value) => { const v = Array.isArray(value) ? value[0] : value; setConstraints(v) }}
                min={1}
                max={20}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>20</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Función Objetivo</CardTitle>
          <CardDescription>
            {problem.problemType === "MAX" ? "Maximizar" : "Minimizar"} Z ={" "}
            {problem.objective
              .map((coeff, i) => `${coeff >= 0 ? "" : ""}${coeff}${varNames[i]}`)
              .join(" + ")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-lg">
              {problem.problemType === "MAX" ? "Max" : "Min"} Z =
            </span>
            {problem.objective.map((coeff, i) => (
              <div key={i} className="flex items-center gap-1">
                <Input
                  type="number"
                  value={displayVal(`obj-${i}`, coeff)}
                  onChange={(e) => handleNumChange(`obj-${i}`, e.target.value, (v) => setObjective(i, v))}
                  onBlur={() => syncDirty(`obj-${i}`)}
                  className="w-20 text-center"
                />
                <span className="font-medium">{varNames[i]}</span>
                {i < problem.objective.length - 1 && (
                  <span className="text-muted-foreground mx-1">+</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restricciones</CardTitle>
          <CardDescription>
            Define las limitaciones del problema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-muted/40 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/25 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(156,163,175,0.25) rgba(243,244,246,0.4)" }}
          >
            <div className="flex">
              <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {varNames.map((name) => (
                    <th key={name} className="text-left py-2 px-3 font-medium">
                      {name}
                    </th>
                  ))}
                  <th className="text-left py-2 px-3 font-medium">Operador</th>
                  <th className="text-left py-2 px-3 font-medium">Valor</th>
                  <th className="py-2 px-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {problem.constraintsData.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {row.coefficients.map((coeff, j) => (
                      <td key={j} className="py-2 px-3">
                        <Input
                          type="number"
                          value={displayVal(`coeff-${i}-${j}`, coeff)}
                          onChange={(e) =>
                            handleNumChange(`coeff-${i}-${j}`, e.target.value, (v) => setConstraintCoefficient(i, j, v))
                          }
                          onBlur={() => syncDirty(`coeff-${i}-${j}`)}
                          className="w-20 text-center"
                        />
                      </td>
                    ))}
                    <td className="py-2 px-3">
                      <Select
                        value={row.operator}
                        onValueChange={(v: string | null) =>
                          v && setConstraintOperator(i, v as "<=" | ">=" | "=")
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<=">≤</SelectItem>
                          <SelectItem value=">=">≥</SelectItem>
                          <SelectItem value="=">=</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        value={displayVal(`val-${i}`, row.value)}
                        onChange={(e) =>
                          handleNumChange(`val-${i}`, e.target.value, (v) => setConstraintValue(i, v))
                        }
                        onBlur={() => syncDirty(`val-${i}`)}
                        className="w-24 text-center"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => duplicateConstraint(i)}
                          title="Duplicar"
                        >
                          <Copy className="size-4" />
                        </Button>
                        {problem.constraints > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeConstraint(i)}
                            title="Eliminar"
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              <div className="sticky right-0 top-0 w-8 shrink-0 pointer-events-none bg-gradient-to-l from-background/90 via-background/30 to-transparent" />
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={addConstraint}>
            <Plus className="size-4 mr-2" />
            Agregar restricción
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Condiciones de las Variables</CardTitle>
          <CardDescription>
            Define el tipo de cada variable de decisión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {varNames.map((name, i) => (
              <div key={i} className="space-y-2 p-4 border rounded-lg">
                <Label className="font-medium">{name}</Label>
                <div className="flex flex-wrap gap-3">
                  {(["positive", "integer", "binary", "free"] as VariableType[]).map(
                    (type) => (
                      <div key={type} className="flex items-center gap-1.5">
                        <Checkbox
                          id={`${name}-${type}`}
                          checked={problem.variableTypes[i] === type}
                          onCheckedChange={() => setVariableType(i, type)}
                        />
                        <Label
                          htmlFor={`${name}-${type}`}
                          className="text-xs font-normal cursor-pointer"
                        >
                          {type === "positive"
                            ? "Positiva"
                            : type === "integer"
                              ? "Entera"
                              : type === "binary"
                                ? "Binaria"
                                : "Libre"}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Cancelar
        </Button>
        <Button onClick={handleSaveAndGo}>
          <Calculator className="size-4 mr-2" />
          Guardar y Resolver
          <ArrowRight className="size-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  )
}
