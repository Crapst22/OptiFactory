import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const systemPrompt = `Eres un experto en Programación Lineal. Ayudas al usuario a modelar problemas de programación lineal.

Responde SIEMPRE de forma natural y conversacional. Sé amable y útil.

Al final de tu respuesta, SI el usuario describió un problema de programación lineal con datos numéricos, agrega EXACTAMENTE esto (sin alterar):
---PARAMS---
{ "title": "título", "problemType": "MAX" o "MIN", "variables": número, "objective": [coefs], "constraintsData": [ { "coefficients": [coefs], "operator": "<=" o ">=" o "=", "value": número } ], "variableTypes": ["positive" o "integer" o "binary" o "free", ...] }
---END---

Reglas para el JSON:
- Si no se especifica tipo de variable, asume "positive"
- Si no se especifica operador, asume "<="
- Usa "MAX" o "MIN"
- Asegúrate de que objective y cada constraint tengan la misma cantidad de coeficientes que variables

Si el usuario NO describió un problema (saluda, pregunta, etc.), NO incluyas ---PARAMS---. Responde normal.`

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
