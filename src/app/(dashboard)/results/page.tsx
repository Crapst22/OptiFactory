"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  DollarSign,
  GitBranch,
  Info,
  Target,
  TrendingUp,
  Zap,
  XCircle,
} from "lucide-react"
import { getCurrentResult } from "@/lib/store"
import { formatNumber } from "@/utils/format"
import type { SimplexResult } from "@/types"

const methodLabels: Record<string, string> = {
  GRAPHICAL: "Método Gráfico",
  SIMPLEX: "Método Simplex",
  INTEGER_PROGRAMMING: "Programación Lineal Entera",
  DUAL_SIMPLEX: "Simplex Dual",
  BIG_M: "Método Gran M",
  TWO_PHASE: "Método de Dos Fases",
  AUTO: "Automático",
}

const statusLabels: Record<string, string> = {
  OPTIMAL: "Óptimo",
  UNBOUNDED: "No Acotado",
  INFEASIBLE: "No Factible",
  MULTIPLE: "Múltiples Soluciones",
  DEGENERATE: "Degenerado",
}

const statusIcons: Record<string, typeof CheckCircle2> = {
  OPTIMAL: CheckCircle2,
  UNBOUNDED: TrendingUp,
  INFEASIBLE: XCircle,
  MULTIPLE: GitBranch,
  DEGENERATE: AlertTriangle,
}

const statusColors: Record<string, string> = {
  OPTIMAL: "text-emerald-500",
  UNBOUNDED: "text-orange-500",
  INFEASIBLE: "text-red-500",
  MULTIPLE: "text-blue-500",
  DEGENERATE: "text-amber-500",
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export default function ResultsPage() {
  const result: SimplexResult | null = getCurrentResult()

  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto mt-12"
      >
        <Card>
          <CardContent className="flex flex-col items-center text-center py-16 gap-4">
            <Zap className="size-12 text-muted-foreground" />
            <div>
              <CardTitle className="text-xl mb-1">Sin resultados</CardTitle>
              <p className="text-muted-foreground text-sm">
                Aún no has resuelto ningún problema. Define y resuelve un problema primero.
              </p>
            </div>
            <Link
              href="/solve"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ir a resolver
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const slackEntries = Object.entries(result.slackVariables ?? {})
  const variableEntries = Object.entries(result.variables ?? {})
  const bindingConstraints = slackEntries
    .filter(([, value]) => Math.abs(value) < 1e-10)
    .map(([key]) => key)

  const StatusIcon = statusIcons[result.status] ?? Info

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resultados</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resultado de la optimización del problema
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="size-5 text-primary" />
            Valor Óptimo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">
            {formatNumber(result.optimalValue)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Esta es la mayor ganancia posible respetando todas las restricciones
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="size-5 text-primary" />
            Variables Óptimas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variable</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Costo Reducido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variableEntries.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell>{formatNumber(value)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatNumber(result.reducedCosts?.[key] ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {variableEntries.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Estos son los valores que deben tomar las variables para alcanzar el valor óptimo.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="size-5 text-primary" />
            Recursos Utilizados y Remanentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slackEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay información de recursos disponible.
            </p>
          ) : (
            <div className="space-y-3">
              {slackEntries.map(([key, value]) => {
                const isBinding = Math.abs(value) < 1e-10
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {key.replace("H", "Recurso ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isBinding
                          ? "Este recurso se ha consumido por completo"
                          : `Quedan ${formatNumber(value)} unidades disponibles`}
                      </p>
                    </div>
                    <Badge
                      variant={isBinding ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {isBinding
                        ? "Agotado"
                        : `${formatNumber(value)} restante`}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="size-5 text-primary" />
            Restricciones Vinculantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bindingConstraints.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {bindingConstraints.map((key) => (
                <Badge key={key} variant="outline" className="text-sm">
                  {key.replace("H", "Restricción ")}
                </Badge>
              ))}
              <p className="w-full text-sm text-muted-foreground mt-3">
                Estas restricciones limitan activamente la solución. Si alguna cambiara, el valor óptimo se vería afectado.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ninguna restricción está limitando activamente la solución.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            Tiempo y Método
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Método utilizado</p>
              <p className="font-semibold mt-1">
                {methodLabels[result.method] ?? result.method}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                Tiempo de ejecución
              </p>
              <p className="font-semibold mt-1">
                {formatTime(result.timeMs)}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Iteraciones</p>
              <p className="font-semibold mt-1">{result.iterations ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="font-semibold mt-1">
                {statusLabels[result.status] ?? result.status}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <StatusIcon
              className={`size-5 ${statusColors[result.status] ?? ""}`}
            />
            Estado de la Solución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {result.statusExplanation ??
              "Solución encontrada correctamente."}
          </p>
          {!result.optimal && (
            <div className="flex items-start gap-2 mt-3 rounded-lg bg-amber-50 dark:bg-amber-950 p-3">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {result.status === "UNBOUNDED"
                  ? "La función objetivo no tiene límite. Revisa las restricciones del problema."
                  : result.status === "INFEASIBLE"
                    ? "No existe una solución que cumpla todas las restricciones. Revisa los datos ingresados."
                    : "La solución encontrada puede requerir revisión adicional."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            Resumen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Valor óptimo</span>
              <span className="font-semibold">
                {formatNumber(result.optimalValue)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Variables</span>
              <span className="font-semibold">
                {variableEntries.length}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">
                Restricciones vinculantes
              </span>
              <span className="font-semibold">
                {bindingConstraints.length}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Método</span>
              <span className="font-semibold">
                {methodLabels[result.method] ?? result.method}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Tiempo</span>
              <span className="font-semibold">
                {formatTime(result.timeMs)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
