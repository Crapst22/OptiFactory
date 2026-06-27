import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const systemPrompt = `Eres un experto en Programación Lineal. Ayudas al usuario a modelar problemas.

INSTRUCCIÓN SOBRE ---PARAMS---:
Cuando el usuario describa un problema CON DATOS NUMÉRICOS, responde con tu análisis y al final agrega esto:

---PARAMS---
{ "title": "Título", "problemType": "MAX o MIN", "variables": 2, "objective": [10, 20], "constraintsData": [ { "coefficients": [1, 2], "operator": "<=", "value": 100 } ], "variableTypes": ["positive", "positive"] }
---END---

Reglas del JSON:
- objective: un número por variable (sin $, sin comas, sin separadores)
- constraintsData: cada restricción tiene coefficients (misma cantidad que variables), operator ("<=", ">=", "="), value (número)
- variableTypes: uno por variable, default "positive"
- Convierte fracciones a decimales (ej: 1/12 → 0.0833)
- Convierte relaciones como "25 por cada 60" a coeficientes: -0.4167, 0, 1 con operator ">="
- Convierte cantidades con $ o separadores a números planos (ej: $22.000 → 22000)

SOLO agrega ---PARAMS--- si el usuario dio datos de un problema. Si saluda o pregunta algo, responde normal sin ---PARAMS---.`

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  })

  if (!groqRes.ok) {
    const text = await groqRes.text()
    return new Response(`Groq error ${groqRes.status}: ${text}`, { status: groqRes.status })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqRes.body?.getReader()
      if (!reader) { controller.close(); return }
      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data: ")) continue
          const data = trimmed.slice(6)
          if (data === "[DONE]") continue
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ""
            if (content) controller.enqueue(encoder.encode(content))
          } catch { /* skip */ }
        }
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
