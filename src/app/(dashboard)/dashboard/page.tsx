"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, GraduationCap, BookOpen, History, Settings, TrendingUp, Clock, FileText } from "lucide-react"
import { motion } from "framer-motion"

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

export default function DashboardPage() {
  const stats = [
    { label: "Problemas resueltos", value: "0", icon: TrendingUp, color: "text-emerald-500" },
    { label: "Tiempo promedio", value: "--", icon: Clock, color: "text-blue-500" },
    { label: "Últimos escenarios", value: "0", icon: FileText, color: "text-violet-500" },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">OptiFactory</h1>
        <p className="text-muted-foreground mt-1">
          Plataforma de optimización de operaciones y programación lineal
        </p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`size-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
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

        <Link href="/tutorial">
          <Card className="group cursor-pointer hover:border-primary/50 transition-colors h-full">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                <GraduationCap className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">Tutorial</CardTitle>
                <CardDescription>Aprende programación lineal</CardDescription>
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
            <CardTitle className="text-lg">Últimas actividades</CardTitle>
            <CardDescription>Tus problemas y escenarios recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <History className="size-12 mx-auto mb-3 opacity-50" />
              <p>Aún no hay actividades</p>
              <p className="text-sm">Crea tu primer problema para empezar</p>
              <Link href="/problems/new">
                <Button className="mt-4" size="sm">
                  <PlusCircle className="size-4 mr-2" />
                  Nuevo Problema
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
