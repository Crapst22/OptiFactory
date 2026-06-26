"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GitCompare, BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { compareScenarios, solveProblem } from "@/services/simplex"
import { formatNumber } from "@/utils/format"
import type { ProblemData, SimplexResult } from "@/types"

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

function getDiffClass(value: number): string {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400"
  if (value < 0) return "text-red-600 dark:text-red-400"
  return "text-muted-foreground"
}

function getBgDiffClass(value: number): string {
  if (value > 0) return "bg-emerald-50 dark:bg-emerald-950/40"
  if (value < 0) return "bg-red-50 dark:bg-red-950/40"
  return ""
}

function DiffIcon({ value }: { value: number }) {
  if (value > 0) return <TrendingUp className="size-4 text-emerald-500" />
  if (value < 0) return <TrendingDown className="size-4 text-red-500" />
  return <Minus className="size-4 text-muted-foreground" />
}

function solveScenario(problem: ProblemData): SimplexResult | null {
  try {
    return solveProblem(problem)
  } catch {
    return null
  }
}

function BarChart({
  baseValue,
  scenarioValue,
  baseLabel,
  scenarioLabel,
  maxValue,
}: {
  baseValue: number
  scenarioValue: number
  baseLabel: string
  scenarioLabel: string
  maxValue?: number
}) {
  const max = maxValue ?? Math.max(Math.abs(baseValue), Math.abs(scenarioValue), 1)
  const barMax = 200

  const hBase = (Math.abs(baseValue) / max) * barMax
  const hScenario = (Math.abs(scenarioValue) / max) * barMax

  const baseColor = scenarioValue >= baseValue ? "bg-primary" : "bg-destructive/70"
  const scenarioColor = scenarioValue >= baseValue ? "bg-emerald-500" : "bg-primary"

  return (
    <div className="flex items-end justify-center gap-8 pt-4" style={{ height: barMax + 40 }}>
      <div className="flex flex-col items-center gap-2">
        <span className={`text-lg font-bold tabular-nums ${getDiffClass(scenarioValue - baseValue)}`}>
          {formatNumber(baseValue)}
        </span>
        <div
          className={`w-10 rounded-t-sm transition-all ${baseColor}`}
          style={{ height: `${Math.max(hBase, 2)}px` }}
        />
        <span className="text-xs text-muted-foreground text-center max-w-24 truncate">
          {baseLabel}
        </span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className={`text-lg font-bold tabular-nums ${getDiffClass(scenarioValue - baseValue)}`}>
          {formatNumber(scenarioValue)}
        </span>
        <div
          className={`w-10 rounded-t-sm transition-all ${scenarioColor}`}
          style={{ height: `${Math.max(hScenario, 2)}px` }}
        />
        <span className="text-xs text-muted-foreground text-center max-w-24 truncate">
          {scenarioLabel}
        </span>
      </div>
    </div>
  )
}

function RadarChart({
  labels,
  baseValues,
  scenarioValues,
  baseLabel,
  scenarioLabel,
}: {
  labels: string[]
  baseValues: number[]
  scenarioValues: number[]
  baseLabel: string
  scenarioLabel: string
}) {
  const n = labels.length
  if (n === 0) return null

  const size = 300
  const cx = size / 2
  const cy = size / 2
  const radius = 110
  const allVals = [...baseValues, ...scenarioValues]
  const maxVal = Math.max(...allVals, 1)

  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {gridLevels.map((level) => (
          <div
            key={level}
            className="absolute rounded-full border border-border/50"
            style={{
              top: cy - radius * level,
              left: cx - radius * level,
              width: radius * 2 * level,
              height: radius * 2 * level,
            }}
          />
        ))}
        {labels.map((label, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2
          const x = cx + radius * Math.cos(angle)
          const y = cy + radius * Math.sin(angle)
          const vBase = baseValues[i] ?? 0
          const vScenario = scenarioValues[i] ?? 0
          const barBase = Math.max((vBase / maxVal) * radius, 2)
          const barScenario = Math.max((vScenario / maxVal) * radius, 2)
          const bxBase = cx + barBase * Math.cos(angle)
          const byBase = cy + barBase * Math.sin(angle)
          const bxScenario = cx + barScenario * Math.cos(angle)
          const byScenario = cy + barScenario * Math.sin(angle)

          return (
            <div key={label}>
              <div
                className="absolute bg-border/70"
                style={{
                  width: 1,
                  height: radius,
                  left: cx,
                  top: cy,
                  transformOrigin: "0 0",
                  transform: `rotate(${angle}rad)`,
                }}
              />
              <div
                className="absolute rounded-md opacity-80"
                style={{
                  width: 8,
                  height: barBase,
                  left: bxBase - 4,
                  top: byBase - barBase,
                  transformOrigin: "50% 100%",
                  transform: `rotate(${angle}rad)`,
                  backgroundColor: "hsl(var(--primary))",
                }}
              />
              <div
                className="absolute rounded-md opacity-80"
                style={{
                  width: 8,
                  height: barScenario,
                  left: bxScenario - 4,
                  top: byScenario - barScenario,
                  transformOrigin: "50% 100%",
                  transform: `rotate(${angle}rad)`,
                  backgroundColor: "hsl(142, 76%, 36%)",
                }}
              />
              <span
                className="absolute text-[10px] text-muted-foreground whitespace-nowrap"
                style={{
                  left: x + 8 * Math.cos(angle) - 16,
                  top: y + 8 * Math.sin(angle) - 6,
                }}
              >
                {label}
              </span>
            </div>
          )
        })}
        <div
          className="absolute rounded-full bg-foreground/10"
          style={{
            width: 6,
            height: 6,
            left: cx - 3,
            top: cy - 3,
          }}
        />
      </div>
      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-sm" style={{ backgroundColor: "hsl(var(--primary))" }} />
          <span>{baseLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-sm" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
          <span>{scenarioLabel}</span>
        </div>
      </div>
    </div>
  )
}

export default function ComparisonPage() {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([])
  const [baseId, setBaseId] = useState<string>("")
  const [scenarioId, setScenarioId] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const data = loadScenarios()
    setScenarios(data)
    setMounted(true)
  }, [])

  const baseScenario = useMemo(
    () => scenarios.find((s) => s.id === baseId) ?? null,
    [scenarios, baseId]
  )
  const compScenario = useMemo(
    () => scenarios.find((s) => s.id === scenarioId) ?? null,
    [scenarios, scenarioId]
  )

  const baseResult = useMemo(
    () => (baseScenario ? solveScenario(baseScenario.problem) : null),
    [baseScenario]
  )
  const compResult = useMemo(
    () => (compScenario ? solveScenario(compScenario.problem) : null),
    [compScenario]
  )

  const comparison = useMemo(() => {
    if (!baseResult || !compResult || !baseScenario || !compScenario) return null
    return compareScenarios(baseResult, compResult, baseScenario.name, compScenario.name)
  }, [baseResult, compResult, baseScenario, compScenario])

  const variableNames = useMemo(() => {
    if (!compResult) return []
    return Object.keys(compResult.variables)
  }, [compResult])

  const slackNames = useMemo(() => {
    if (!compResult) return []
    return Object.keys(compResult.slackVariables)
  }, [compResult])

  const resourceLabels = useMemo(
    () => slackNames.map((k) => k.replace("H", "R")),
    [slackNames]
  )

  const baseSlackValues = useMemo(
    () => slackNames.map((k) => baseResult?.slackVariables[k] ?? 0),
    [slackNames]
  )
  const compSlackValues = useMemo(
    () => slackNames.map((k) => compResult?.slackVariables[k] ?? 0),
    [slackNames]
  )

  const baseVarValues = useMemo(
    () => variableNames.map((k) => baseResult?.variables[k] ?? 0),
    [variableNames]
  )
  const compVarValues = useMemo(
    () => variableNames.map((k) => compResult?.variables[k] ?? 0),
    [variableNames]
  )

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (scenarios.length < 2) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Comparación de Escenarios</h1>
          <p className="text-sm text-muted-foreground">
            Selecciona dos escenarios guardados para comparar sus resultados
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitCompare className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              Se necesitan al menos dos escenarios
            </p>
            <p className="text-muted-foreground text-sm">
              Guarda al menos dos escenarios diferentes desde la sección de Escenarios para poder compararlos.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedBase = scenarios.find((s) => s.id === baseId)
  const selectedScenario = scenarios.find((s) => s.id === scenarioId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comparación de Escenarios</h1>
        <p className="text-sm text-muted-foreground">
          Analiza las diferencias entre dos configuraciones de problema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Escenario Base</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={baseId}
              onChange={(e) => {
                setBaseId(e.target.value)
                if (e.target.value === scenarioId) setScenarioId("")
              }}
            >
              <option value="">Seleccionar escenario base...</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === scenarioId}>
                  {s.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Escenario a Comparar</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={scenarioId}
              onChange={(e) => {
                setScenarioId(e.target.value)
                if (e.target.value === baseId) setBaseId("")
              }}
            >
              <option value="">Seleccionar escenario...</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === baseId}>
                  {s.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>

      {!selectedBase || !selectedScenario || !baseResult || !compResult || !comparison ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitCompare className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Selecciona dos escenarios para ver la comparación</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="size-5 text-primary" />
                Comparación General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Métrica</TableHead>
                    <TableHead className="text-center">{comparison.baseName}</TableHead>
                    <TableHead className="text-center">{comparison.scenarioName}</TableHead>
                    <TableHead className="text-center">Diferencia</TableHead>
                    <TableHead className="text-center">Variación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className={getBgDiffClass(comparison.optimalValueDiff)}>
                    <TableCell className="font-medium">Ganancia óptima</TableCell>
                    <TableCell className="text-center tabular-nums">
                      {formatNumber(comparison.baseOptimalValue)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {formatNumber(comparison.scenarioOptimalValue)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center gap-1 tabular-nums font-medium ${getDiffClass(comparison.optimalValueDiff)}`}>
                        <DiffIcon value={comparison.optimalValueDiff} />
                        {comparison.optimalValueDiff > 0 ? "+" : ""}
                        {formatNumber(comparison.optimalValueDiff)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={comparison.optimalValueDiff >= 0 ? "default" : "destructive"}
                        className="tabular-nums"
                      >
                        {comparison.optimalValuePercent > 0 ? "+" : ""}
                        {comparison.optimalValuePercent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {variableNames.map((varName, i) => {
                    const baseVal = baseVarValues[i]
                    const compVal = compVarValues[i]
                    const diff = compVal - baseVal
                    const pct = baseVal !== 0 ? ((compVal - baseVal) / Math.abs(baseVal)) * 100 : 0
                    return (
                      <TableRow key={varName} className={getBgDiffClass(diff)}>
                        <TableCell className="font-medium">Producción {varName}</TableCell>
                        <TableCell className="text-center tabular-nums">
                          {formatNumber(baseVal)}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {formatNumber(compVal)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center gap-1 tabular-nums font-medium ${getDiffClass(diff)}`}>
                            <DiffIcon value={diff} />
                            {diff > 0 ? "+" : ""}
                            {formatNumber(diff)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {baseVal !== 0 && (
                            <Badge
                              variant={diff >= 0 ? "default" : "destructive"}
                              className="tabular-nums"
                            >
                              {pct > 0 ? "+" : ""}
                              {pct.toFixed(1)}%
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {resourceLabels.map((label, i) => {
                    const baseVal = baseSlackValues[i]
                    const compVal = compSlackValues[i]
                    const diff = compVal - baseVal
                    const isBindingBase = Math.abs(baseVal) < 1e-10
                    const isBindingComp = Math.abs(compVal) < 1e-10
                    return (
                      <TableRow key={label} className={getBgDiffClass(diff)}>
                        <TableCell className="font-medium">Recurso {label}</TableCell>
                        <TableCell className="text-center tabular-nums">
                          {formatNumber(baseVal)}
                          {isBindingBase && (
                            <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">
                              Crítico
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {formatNumber(compVal)}
                          {isBindingComp && (
                            <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">
                              Crítico
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center gap-1 tabular-nums font-medium ${getDiffClass(diff)}`}>
                            <DiffIcon value={diff} />
                            {diff > 0 ? "+" : ""}
                            {formatNumber(diff)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {baseVal !== 0 && (
                            <Badge
                              variant={diff >= 0 ? "default" : "destructive"}
                              className="tabular-nums"
                            >
                              {((diff / Math.abs(baseVal)) * 100).toFixed(1)}%
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  Comparación de Valor Óptimo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  baseValue={comparison.baseOptimalValue}
                  scenarioValue={comparison.scenarioOptimalValue}
                  baseLabel={comparison.baseName}
                  scenarioLabel={comparison.scenarioName}
                />
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Diferencia:{" "}
                  <span className={getDiffClass(comparison.optimalValueDiff)}>
                    {comparison.optimalValueDiff > 0 ? "+" : ""}
                    {formatNumber(comparison.optimalValueDiff)} ({comparison.optimalValuePercent > 0 ? "+" : ""}
                    {comparison.optimalValuePercent.toFixed(1)}%)
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GitCompare className="size-4 text-primary" />
                  Comparación de Producción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {variableNames.map((varName, i) => {
                    const baseVal = baseVarValues[i]
                    const compVal = compVarValues[i]
                    const diff = compVal - baseVal
                    const pct = baseVal !== 0 ? ((compVal - baseVal) / Math.abs(baseVal)) * 100 : 0
                    const max = Math.max(Math.abs(baseVal), Math.abs(compVal), 1)
                    return (
                      <div key={varName} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{varName}</span>
                          <span className={getDiffClass(diff)}>
                            {formatNumber(baseVal)} → {formatNumber(compVal)}
                            {diff !== 0 && (
                              <span className="ml-1 text-xs">
                                ({diff > 0 ? "+" : ""}
                                {pct.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex h-5 gap-0.5 rounded-sm overflow-hidden">
                          <div
                            className="bg-primary transition-all"
                            style={{ width: `${(Math.abs(baseVal) / max) * 50}%` }}
                          />
                          <div
                            className="bg-emerald-500 transition-all"
                            style={{ width: `${(Math.abs(compVal) / max) * 50}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{comparison.baseName}</span>
                          <span>{comparison.scenarioName}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <GitCompare className="size-5 text-primary" />
                Uso de Recursos (Radar)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              {slackNames.length > 0 ? (
                <RadarChart
                  labels={resourceLabels}
                  baseValues={baseSlackValues}
                  scenarioValues={compSlackValues}
                  baseLabel={comparison.baseName}
                  scenarioLabel={comparison.scenarioName}
                />
              ) : (
                <p className="text-sm text-muted-foreground py-8">
                  No hay información de recursos disponible para la comparación radial.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
