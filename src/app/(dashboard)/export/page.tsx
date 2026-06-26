"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileDown,
  FileText,
  FileSpreadsheet,
  FileImage,
  Download,
  CheckCircle2,
} from "lucide-react"
import { getCurrentProblem, getCurrentResult } from "@/lib/store"
import { formatNumber } from "@/utils/format"
import type { ProblemData, SimplexResult } from "@/types"

interface ExportOption {
  id: string
  title: string
  description: string
  icon: typeof FileText
  formats: string
}

const exportOptions: ExportOption[] = [
  {
    id: "pdf",
    title: "PDF",
    description: "Exporta un informe completo con los datos del problema, variables, restricciones y resultados de la optimización.",
    icon: FileText,
    formats: "Documento portátil",
  },
  {
    id: "csv",
    title: "CSV",
    description: "Exporta los valores de las variables y holguras en formato de valores separados por comas, ideal para hojas de cálculo.",
    icon: FileSpreadsheet,
    formats: "Valores separados por comas",
  },
  {
    id: "excel",
    title: "Excel",
    description: "Exporta los resultados a un archivo de Excel con formato estructurado. (Requiere librería adicional — próximamente)",
    icon: FileSpreadsheet,
    formats: "Libro de Excel (.xlsx)",
  },
  {
    id: "image",
    title: "Imagen",
    description: "Genera una captura de los resultados en formato de imagen PNG. (Funcionalidad en desarrollo)",
    icon: FileImage,
    formats: "PNG / JPEG",
  },
]

const statusLabels: Record<string, string> = {
  OPTIMAL: "Óptimo",
  UNBOUNDED: "No Acotado",
  INFEASIBLE: "No Factible",
  MULTIPLE: "Múltiples Soluciones",
  DEGENERATE: "Degenerado",
}

function generateCSV(result: SimplexResult): string {
  const headers = ["Variable", "Valor"]
  const varRows = Object.entries(result.variables).map(
    ([k, v]) => `${k},${v}`,
  )
  const slackHeaders = ["Holgura", "Valor"]
  const slackRows = Object.entries(result.slackVariables ?? {}).map(
    ([k, v]) => `${k},${v}`,
  )
  const meta = [
    "Optimo,Resultado",
    `Valor Óptimo,${result.optimalValue}`,
    `Estado,${statusLabels[result.status] ?? result.status}`,
    `Iteraciones,${result.iterations}`,
  ]
  return [
    ...meta,
    "",
    headers.join(","),
    ...varRows,
    "",
    slackHeaders.join(","),
    ...slackRows,
  ].join("\n")
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, filename)
}

export default function ExportPage() {
  const [exporting, setExporting] = useState<string | null>(null)

  const problem: ProblemData | null = getCurrentProblem()
  const result: SimplexResult | null = getCurrentResult()

  const handleExportPDF = useCallback(async () => {
    if (!problem || !result) return
    setExporting("pdf")
    try {
      const { default: jsPDF } = await import("jspdf")
      const doc = new jsPDF()
      const pageW = doc.internal.pageSize.getWidth()
      let y = 20

      doc.setFontSize(18)
      doc.text("Informe de Optimización", pageW / 2, y, { align: "center" })
      y += 12

      doc.setFontSize(11)
      doc.text(`Título: ${problem.title}`, 14, y)
      y += 7
      doc.text(
        `Tipo: ${problem.problemType === "MAX" ? "Maximización" : "Minimización"}`,
        14,
        y,
      )
      y += 7
      doc.text(`Método: ${problem.method}`, 14, y)
      y += 10

      doc.setFontSize(14)
      doc.text("Función Objetivo", 14, y)
      y += 8
      doc.setFontSize(10)
      const objStr = problem.objective
        .map((c, i) => `${c >= 0 ? "+" : ""}${c}x${i + 1}`)
        .join(" ")
      doc.text(`Z = ${objStr.replace(/^\+/, "")}`, 14, y)
      y += 10

      doc.setFontSize(14)
      doc.text("Restricciones", 14, y)
      y += 8
      doc.setFontSize(10)
      for (const row of problem.constraintsData) {
        const rowStr =
          row.coefficients
            .map((c, i) => `${c >= 0 ? "+" : ""}${c}x${i + 1}`)
            .join(" ")
            .replace(/^\+/, "") +
          ` ${row.operator} ${row.value}`
        doc.text(rowStr, 14, y)
        y += 6
        if (y > 270) {
          doc.addPage()
          y = 20
        }
      }
      y += 6

      doc.setFontSize(14)
      doc.text("Resultados", 14, y)
      y += 8

      doc.setFontSize(11)
      doc.text(
        `Valor Óptimo: ${formatNumber(result.optimalValue)}`,
        14,
        y,
      )
      y += 8
      doc.text(`Estado: ${statusLabels[result.status] ?? result.status}`, 14, y)
      y += 8
      doc.text(`Iteraciones: ${result.iterations}`, 14, y)
      y += 8
      doc.text(`Tiempo: ${result.timeMs} ms`, 14, y)
      y += 10

      doc.setFontSize(12)
      doc.text("Variables Óptimas", 14, y)
      y += 8
      doc.setFontSize(10)
      for (const [key, value] of Object.entries(result.variables)) {
        doc.text(`${key} = ${formatNumber(value)}`, 14, y)
        y += 6
      }
      y += 6

      if (
        result.slackVariables &&
        Object.keys(result.slackVariables).length > 0
      ) {
        doc.setFontSize(12)
        doc.text("Holguras (Slack)", 14, y)
        y += 8
        doc.setFontSize(10)
        for (const [key, value] of Object.entries(result.slackVariables)) {
          doc.text(`${key} = ${formatNumber(value)}`, 14, y)
          y += 6
        }
      }

      doc.save(`informe-optimizacion-${Date.now()}.pdf`)
    } catch {
      // fallback
    } finally {
      setExporting(null)
    }
  }, [problem, result])

  const handleExportCSV = useCallback(() => {
    if (!result) return
    setExporting("csv")
    try {
      const csv = generateCSV(result)
      downloadCSV(csv, `resultados-${Date.now()}.csv`)
    } finally {
      setExporting(null)
    }
  }, [result])

  const handleExportExcel = useCallback(() => {
    setExporting("excel")
    setTimeout(() => setExporting(null), 1500)
  }, [])

  const handleExportImage = useCallback(() => {
    setExporting("image")
    setTimeout(() => setExporting(null), 1500)
  }, [])

  const handlers: Record<string, () => void> = {
    pdf: handleExportPDF,
    csv: handleExportCSV,
    excel: handleExportExcel,
    image: handleExportImage,
  }

  if (!problem || !result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto mt-12"
      >
        <Card>
          <CardContent className="flex flex-col items-center text-center py-16 gap-4">
            <FileDown className="size-12 text-muted-foreground" />
            <div>
              <CardTitle className="text-xl mb-1">
                Sin datos para exportar
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                No hay ningún problema resuelto disponible. Define y resuelve un
                problema primero para poder exportar los resultados.
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exportar</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Exporta los resultados del problema en el formato que prefieras
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle2 className="size-5 text-primary shrink-0" />
          <div className="text-sm">
            <span className="font-medium">Problema: {problem.title}</span>
            <span className="text-muted-foreground">
              {" — "}Valor óptimo: {formatNumber(result.optimalValue)}
            </span>
            <Badge variant="outline" className="ml-2 text-xs">
              {statusLabels[result.status] ?? result.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        {exportOptions.map((opt) => {
          const Icon = opt.icon
          const isLoading = exporting === opt.id
          const isPlaceholder = opt.id === "excel" || opt.id === "image"

          return (
            <Card
              key={opt.id}
              className="relative overflow-hidden transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{opt.title}</CardTitle>
                  </div>
                  {isPlaceholder && (
                    <Badge variant="secondary" className="text-xs">
                      Próximamente
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-2">
                  {opt.formats}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {opt.description}
                </p>
                <Button
                  className="w-full gap-2"
                  variant={isPlaceholder ? "outline" : "default"}
                  disabled={isLoading || isPlaceholder}
                  onClick={handlers[opt.id]}
                >
                  {isLoading ? (
                    <span className="size-4 animate-pulse rounded-full bg-current" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {isLoading
                    ? "Exportando..."
                    : isPlaceholder
                      ? "No disponible"
                      : `Exportar como ${opt.title}`}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </motion.div>
  )
}
