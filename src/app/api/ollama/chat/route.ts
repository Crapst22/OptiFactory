import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const { messages, extractOnly } = await req.json()

  const systemPrompt = extractOnly
    ? `Eres un experto en Programación Lineal. Extrae los parámetros del problema descrito en la conversación y devuelve SOLO un JSON válido (sin texto, sin markdown):

{
  "title": "título descriptivo",
  "problemType": "MAX" o "MIN",
  "variables": número (2-10),
  "objective": [coeficientes],
  "constraintsData": [
    { "coefficients": [coeficientes], "operator": "<=" o ">=" o "=", "value": número }
  ],
  "variableTypes": ["positive" o "integer" o "binary" o "free"]
}

Reglas:
- Cada constraint debe tener la misma cantidad de coeficientes que variables
- variableTypes: uno por variable, default "positive"
- operator default: "<="
- Sin explicaciones, solo el JSON`
    : `Eres un experto en Programación Lineal. Ayudas al usuario a modelar problemas.

Responde de forma natural y conversacional. Si el usuario da datos numéricos de un problema, ayúdalo a entenderlo. Si solo saluda, responde amablemente.

NO agregues JSON ni marcadores en tu respuesta.`

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
