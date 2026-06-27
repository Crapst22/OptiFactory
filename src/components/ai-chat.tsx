"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, Sparkles, Bot, User, CheckCircle2, Brain } from "lucide-react"
import { sendMessage, extractProblemFromResponse, ChatMessage } from "@/services/ollama"
import { ProblemData } from "@/types"

interface AiChatProps {
  onApplyProblem: (problem: Partial<ProblemData>) => void
}

export function AiChat({ onApplyProblem }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hola! Soy tu asistente de Programación Lineal. Cuéntame el enunciado de tu problema y cuando estés listo presiona 'Extraer parámetros' para llenar el formulario automáticamente.",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [parsedProblem, setParsedProblem] = useState<Partial<ProblemData> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingText])

  const handleSend = async () => {
    const userMsg = input.trim()
    if (!userMsg || loading) return

    setInput("")
    setStreamingText("")
    const userMessage: ChatMessage = { role: "user", content: userMsg }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    setParsedProblem(null)

    const allMessages = [...messages, userMessage]

    try {
      const fullContent = await sendMessage(allMessages, (token) => {
        setStreamingText((prev) => prev + token)
      })
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullContent },
      ])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error al conectar con la IA: ${msg}. Verifica que la API key de Groq esté configurada.`,
        },
      ])
    } finally {
      setLoading(false)
      setStreamingText("")
    }
  }

  const handleExtract = async () => {
    setExtracting(true)
    setParsedProblem(null)
    setStreamingText("")

    try {
      const fullContent = await sendMessage(messages, (token) => {
        setStreamingText((prev) => prev + token)
      }, true)

      const problem = extractProblemFromResponse(fullContent)
      if (problem) {
        setParsedProblem(problem)
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "No pude extraer los parámetros. ¿Podrías describir el problema con más detalles? Incluye los coeficientes numéricos, restricciones y el tipo de optimización (maximizar/minimizar).",
          },
        ])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error al extraer parámetros: ${msg}`,
        },
      ])
    } finally {
      setExtracting(false)
      setStreamingText("")
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        <Bot className="size-5 text-primary" />
        <span className="font-semibold">Asistente IA</span>
        <span className="text-xs text-muted-foreground ml-auto">Groq · Llama 3.3 70B</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="size-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="size-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {streamingText && (
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="max-w-[80%] rounded-lg px-4 py-2.5 text-sm bg-muted whitespace-pre-wrap">
                {streamingText}
                <span className="animate-pulse ml-0.5">|</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {parsedProblem && (
        <div className="px-4 py-3 border-t bg-muted/50 shrink-0">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Parámetros extraídos correctamente</p>
              <p className="text-xs text-muted-foreground truncate">
                {parsedProblem.problemType === "MAX" ? "Maximizar" : "Minimizar"} Z ={" "}
                {parsedProblem.objective?.join(", ")} ·{" "}
                {parsedProblem.constraints} restricciones ·{" "}
                {parsedProblem.variables} variables
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                onApplyProblem(parsedProblem)
                setParsedProblem(null)
              }}
            >
              <Sparkles className="size-3.5 mr-1.5" />
              Aplicar
            </Button>
          </div>
        </div>
      )}

      {messages.filter(m => m.role === "user").length > 0 && !parsedProblem && (
        <div className="px-4 py-2 border-t shrink-0">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleExtract}
            disabled={extracting || loading}
          >
            {extracting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Brain className="size-4" />
            )}
            {extracting ? "Extrayendo parámetros..." : "Extraer parámetros"}
          </Button>
        </div>
      )}

      <div className="p-4 border-t shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe tu problema de programación lineal..."
            disabled={loading || extracting}
          />
          <Button type="submit" size="icon" disabled={loading || extracting || !input.trim()}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
