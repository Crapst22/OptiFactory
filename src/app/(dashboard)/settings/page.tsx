"use client"

import { useConfig } from "@/hooks/use-config"
import { useTheme } from "@/components/layout/theme-provider"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Sun,
  Moon,
  Monitor,
  Languages,
  SlidersHorizontal,
  Activity,
  Eye,
  Save,
} from "lucide-react"
import type { SolveMethod } from "@/types"

const methods: { value: SolveMethod; label: string }[] = [
  { value: "AUTO", label: "Automático" },
  { value: "SIMPLEX", label: "Simplex" },
  { value: "INTEGER_PROGRAMMING", label: "Programación Lineal Entera" },
  { value: "BIG_M", label: "Big M" },
  { value: "TWO_PHASE", label: "Dos Fases" },
  { value: "DUAL_SIMPLEX", label: "Simplex Dual" },
  { value: "GRAPHICAL", label: "Gráfico" },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function SettingsPage() {
  const { config, updateConfig } = useConfig()
  const { setTheme } = useTheme()

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto space-y-8 pb-12"
    >
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Personaliza tu experiencia en Learn IO
        </p>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center">
                {config.theme === "dark" ? (
                  <Moon className="size-5 text-orange-500" />
                ) : config.theme === "light" ? (
                  <Sun className="size-5 text-orange-500" />
                ) : (
                  <Monitor className="size-5 text-orange-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">Apariencia</CardTitle>
                <CardDescription>
                  Configura el tema visual de la aplicación
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Tema</Label>
              <RadioGroup
                value={config.theme}
                onValueChange={(value: string | null) => {
                  if (!value) return
                  const theme = value as "light" | "dark" | "system"
                  setTheme(theme)
                  updateConfig({ theme })
                }}
                className="flex flex-wrap gap-3"
              >
                <Label className="flex items-center gap-2 rounded-lg border border-input has-data-checked:border-primary has-data-checked:bg-primary/5 px-4 py-3 cursor-pointer transition-colors">
                  <RadioGroupItem value="light" />
                  <Sun className="size-4" />
                  <span className="text-sm font-normal">Claro</span>
                </Label>
                <Label className="flex items-center gap-2 rounded-lg border border-input has-data-checked:border-primary has-data-checked:bg-primary/5 px-4 py-3 cursor-pointer transition-colors">
                  <RadioGroupItem value="dark" />
                  <Moon className="size-4" />
                  <span className="text-sm font-normal">Oscuro</span>
                </Label>
                <Label className="flex items-center gap-2 rounded-lg border border-input has-data-checked:border-primary has-data-checked:bg-primary/5 px-4 py-3 cursor-pointer transition-colors">
                  <RadioGroupItem value="system" />
                  <Monitor className="size-4" />
                  <span className="text-sm font-normal">Sistema</span>
                </Label>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                <Languages className="size-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Idioma</CardTitle>
                <CardDescription>
                  Selecciona el idioma de la interfaz
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Idioma</Label>
              <Select
                value={config.language}
                onValueChange={(value: string | null) =>
                  value && updateConfig({ language: value as "es" | "en" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                <SlidersHorizontal className="size-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Precisión Decimal</CardTitle>
                <CardDescription>
                  Número de decimales mostrados en los resultados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Decimales: {config.precision}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {config.precision} dígito{config.precision !== 1 ? "s" : ""}
              </span>
            </div>
            <Slider
              value={[config.precision]}
              min={0}
              max={6}
              step={1}
              onValueChange={(value: number | readonly number[]) => {
                const v = Array.isArray(value) ? value[0] : value;
                updateConfig({ precision: v })
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>6</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center">
                <Activity className="size-5 text-violet-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Método por Defecto</CardTitle>
                <CardDescription>
                  Método de resolución predeterminado para nuevos problemas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Método</Label>
            <Select
              value={config.defaultMethod}
              onValueChange={(value: string | null) =>
                value && updateConfig({ defaultMethod: value as SolveMethod })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
                <Eye className="size-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Animaciones</CardTitle>
                <CardDescription>
                  Activa o desactiva las animaciones de la interfaz
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Animaciones</Label>
                <p className="text-xs text-muted-foreground">
                  {config.animations
                    ? "Las animaciones están activadas"
                    : "Las animaciones están desactivadas"}
                </p>
              </div>
              <Switch
                checked={config.animations}
                onCheckedChange={(checked: boolean) =>
                  updateConfig({ animations: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
          <Save className="size-4" />
          <span>Todos los cambios se guardan automáticamente</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
