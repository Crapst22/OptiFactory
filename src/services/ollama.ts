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

export function extractProblemFromResponse(text: string): { displayText: string; problem: Partial<ProblemData> | null } {
  // Match ---PARAMS--- or ---\nPARAMS--- or ---PARAMS--- (flexible)
  const paramsMatch = text.match(/---\s*PARAMS---\s*(\{[\s\S]*?\})\s*---END---/)
  if (!paramsMatch) {
    return { displayText: text, problem: null }
  }

  const displayText = text.replace(/---PARAMS---[\s\S]*?---END---/, "").trim()

  // Normalize the JSON before parsing: replace expressions like 1/12 with evaluated decimals
  let jsonStr = paramsMatch[1]
    // Replace "number/number" with evaluated float (e.g. 1/12 → 0.083333)
    .replace(/(\d+)\s*\/\s*(\d+)/g, (_m, a, b) => String(Number(a) / Number(b)))
    // Remove $ and commas from numbers
    .replace(/\$(\d+)/g, "$1")
    .replace(/(\d),(\d{3})/g, "$1$2")

  try {
    const data = JSON.parse(jsonStr)

    const vars = Math.max(2, Math.min(10, data.variables || 2))
    const cons = data.constraintsData?.length || 2

    const problem: Partial<ProblemData> = {
      title: data.title || "Problema desde IA",
      problemType: data.problemType === "MIN" ? "MIN" : "MAX",
      method: "AUTO",
      variables: vars,
      constraints: cons,
      objective: Array(vars).fill(0).map((_, i) => data.objective?.[i] ?? 10),
      constraintsData: Array(cons).fill(null).map((_, i) => ({
        coefficients: Array(vars).fill(0).map((_, j) => data.constraintsData?.[i]?.coefficients?.[j] ?? 1),
        operator: data.constraintsData?.[i]?.operator || "<=",
        value: data.constraintsData?.[i]?.value ?? 100,
      })),
      variableTypes: Array(vars).fill("positive").map((_, i) => data.variableTypes?.[i] || "positive"),
    }

    return { displayText: displayText || "Parámetros extraídos correctamente.", problem }
  } catch {
    return { displayText: text.replace(/---PARAMS---[\s\S]*?---END---/, "").trim(), problem: null }
  }
}
