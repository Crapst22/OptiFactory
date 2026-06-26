"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Brain, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function ProblemsPage() {
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
