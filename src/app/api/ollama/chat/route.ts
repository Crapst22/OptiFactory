import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const systemPrompt = `Eres un experto en Programación Lineal. Tu tarea es analizar enunciados de problemas escritos en lenguaje natural y extraer los parámetros del modelo matemático.

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

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama3.3-70b-versatile",
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
      if (!reader) {
        controller.close()
        return
      }
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
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          } catch {
            // skip malformed lines
          }
        }
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
