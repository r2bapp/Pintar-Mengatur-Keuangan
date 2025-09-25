"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Bot, Send, UserIcon, Lightbulb } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { Footer } from "@/components/footer"

// Define a type for chat messages
interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function AIAssistantPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
      return
    }
  }, [user, loading, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsSending(true)

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          userId: user?.id,
          userProfile: profile,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + "-ai",
        role: "assistant",
        content: data.response,
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error sending message to AI:", error)
      toast.error("Gagal mendapatkan respons dari AI. Coba lagi nanti.")
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-error",
          role: "assistant",
          content: "Maaf, saya tidak dapat memproses permintaan Anda saat ini.",
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat asisten AI...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Sesi tidak ditemukan</p>
          <Button onClick={() => router.push("/")} className="bg-navy-600 hover:bg-navy-700">
            Kembali ke Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-navy-gradient shadow-sm border-b border-navy-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-white hover:bg-navy-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div className="flex items-center space-x-2">
                <div className="bg-white/10 p-2 rounded-lg shadow-md">
                  <img src="/logo.png" alt="KeuanganPintar Pro" className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Asisten AI Keuangan</h1>
                  <p className="text-sm text-sage-100">Dapatkan saran finansial personal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col container mx-auto px-4 py-8 max-w-3xl">
        <Card className="flex-1 flex flex-col border-gray-200 shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center space-x-2 text-navy-800">
              <Bot className="h-5 w-5" />
              <span>Asisten Keuangan Anda</span>
            </CardTitle>
            <CardDescription>Tanyakan apa saja tentang keuangan Anda</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="flex-1 space-y-4 mb-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Lightbulb className="h-10 w-10 mx-auto mb-4 text-gold-500" />
                  <p>Halo! Saya asisten AI keuangan Anda. Bagaimana saya bisa membantu?</p>
                  <p className="text-sm mt-2">Contoh: "Bagaimana cara menghemat uang untuk liburan?"</p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="bg-navy-100 p-2 rounded-full">
                      <Bot className="h-4 w-4 text-navy-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-navy-600 text-white"
                        : "bg-gray-100 text-gray-800 border border-gray-200"
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="bg-sage-100 p-2 rounded-full">
                      <UserIcon className="h-4 w-4 text-sage-600" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto pt-4 border-t">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pesan Anda..."
                className="flex-1 resize-none"
                rows={1}
                disabled={isSending}
              />
              <Button type="submit" disabled={!input.trim() || isSending}>
                {isSending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
