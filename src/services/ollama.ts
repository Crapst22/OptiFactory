"use client"

import { ProblemData } from "@/types"

const OLLAMA_URL = "http://localhost:11434/api/chat"
const MODEL = "llama3.2:1b"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const SYSTEM_PROMPT = `Eres un experto en Programación Lineal. Tu tarea es analizar enunciados de problemas escritos en lenguaje natural y extraer los parámetros del modelo matemático.

Debes devolver SOLO un objeto JSON válido con esta estructura exacta (sin texto adicional, sin markdown, solo el JSON):

{
  "title": "Título descriptivo del problema",
  "problemType": "MAX" o "MIN",
  "variables": número entero (2-10),
  "objective": [coeficientes numéricos, uno por variable],
  "constraintsData": [
    {
      "coefficients": [coeficientes numéricos],
      "operator": "<=" o ">=" o "=",
      "value": número
    }
  ],
  "variableTypes": ["positive" o "integer" o "binary" o "free", ...]
}

Reglas:
- Si no se especifica tipo, asume variable positiva ("positive")
- Si no se especifica operador, asume "<="
- Usa "MAX" para maximización y "MIN" para minimización
- Asegúrate de que la cantidad de coeficientes en objective coincida con variables
- Asegúrate de que cada constraintsData tenga la misma cantidad de coeficientes que variables
- Responde ÚNICAMENTE con el JSON, sin explicaciones`

export async function sendMessage(
  messages: ChatMessage[],
  onToken: (token: string) => void
): Promise<string> {
  const chatMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ]

  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: chatMessages,
      stream: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ollama error ${res.status}: ${text}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error("No response body")

  const decoder = new TextDecoder()
  let fullContent = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split("\n").filter(Boolean)

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line)
        const token = parsed.message?.content || ""
        fullContent += token
        onToken(token)
      } catch {
        // skip partial lines
      }
    }
  }

  return fullContent
}

export function extractProblemFromResponse(text: string): Partial<ProblemData> | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const data = JSON.parse(jsonMatch[0])

    const vars = Math.max(2, Math.min(10, data.variables || 2))
    const cons = data.constraintsData?.length || 2

    return {
      title: data.title || "Problema desde IA",
      problemType: data.problemType === "MIN" ? "MIN" : "MAX",
      method: "AUTO",
      variables: vars,
      constraints: cons,
      objective: Array(vars)
        .fill(0)
        .map((_, i) => data.objective?.[i] ?? 10),
      constraintsData: Array(cons)
        .fill(null)
        .map((_, i) => ({
          coefficients: Array(vars)
            .fill(0)
            .map((_, j) => data.constraintsData?.[i]?.coefficients?.[j] ?? 1),
          operator: data.constraintsData?.[i]?.operator || "<=",
          value: data.constraintsData?.[i]?.value ?? 100,
        })),
      variableTypes: Array(vars)
        .fill("positive")
        .map((_, i) => data.variableTypes?.[i] || "positive"),
    }
  } catch {
    return null
  }
}
