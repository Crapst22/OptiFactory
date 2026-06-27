"use client"

import { ProblemData } from "@/types"

const API_URL = "/api/ollama/chat"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export async function sendMessage(
  messages: ChatMessage[],
  onToken: (token: string) => void
): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Error ${res.status}: ${text}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error("No response body")

  const decoder = new TextDecoder()
  let fullContent = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    fullContent += chunk
    onToken(chunk)
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
