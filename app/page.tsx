"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ShoppingBag, Send, Bot, User, LineChart, TrendingDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import PriceChart from "@/components/price-chart"
import PricePrediction from "@/components/price-prediction"
import ProductComparison from "@/components/product-comparison"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ShoppingAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeProduct, setActiveProduct] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sample shopping questions to help users get started
  const sampleQuestions = [
    "What's the current price of iPhone 15?",
    "Compare prices of Samsung Galaxy S23 across all sellers",
    "Which seller has the cheapest MacBook Pro?",
    "Show me price history for Dell XPS",
    "Predict future prices for Sony Bravia 55 inch 4K TV",
    "What's the best time to buy an iPhone 14?",
  ]

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Process the query and generate a response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: input }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      // Add AI response to chat
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
      }
      setMessages((prev) => [...prev, aiMessage])

      // Set active product if available
      if (data.product) {
        setActiveProduct(data.product)
        setActiveTab("analysis")
      }
    } catch (error) {
      console.error("Error:", error)
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle clicking a sample question
  const handleSampleQuestion = (question: string) => {
    setInput(question)
    const fakeEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>

    // We need to set the input first, then submit
    setTimeout(() => handleSubmit(fakeEvent), 100)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold">Smart Shopping Assistant</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === "chat" ? "default" : "outline"}
              onClick={() => setActiveTab("chat")}
              className={activeTab === "chat" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Chat
            </Button>
            <Button
              variant={activeTab === "analysis" ? "default" : "outline"}
              onClick={() => setActiveTab("analysis")}
              className={activeTab === "analysis" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              disabled={!activeProduct}
            >
              Price Analysis
            </Button>
            <Button
              variant={activeTab === "compare" ? "default" : "outline"}
              onClick={() => setActiveTab("compare")}
              className={activeTab === "compare" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              Compare Products
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="chat" className="mt-0">
            <Card className="w-full">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center text-emerald-700">
                  <Bot className="w-5 h-5 mr-2" />
                  AI Shopping Assistant
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                {/* Messages container */}
                <div className="h-[60vh] overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <ShoppingBag className="w-16 h-16 mb-4 text-emerald-600 opacity-50" />
                      <h2 className="mb-2 text-xl font-semibold text-gray-700">Your Shopping Assistant</h2>
                      <p className="mb-6 text-gray-500">
                        Ask me about product prices, comparisons, or for shopping recommendations!
                      </p>

                      <div className="w-full max-w-md">
                        <h3 className="mb-2 text-sm font-medium text-gray-500">Try asking:</h3>
                        <div className="flex flex-wrap gap-2">
                          {sampleQuestions.map((question, index) => (
                            <button
                              key={index}
                              onClick={() => handleSampleQuestion(question)}
                              className="px-3 py-1 text-sm text-left text-emerald-700 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex items-start max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 ${
                              message.role === "user" ? "bg-emerald-100 ml-2" : "bg-gray-200"
                            }`}
                          >
                            {message.role === "user" ? (
                              <User className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <Bot className="w-4 h-4 text-gray-700" />
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-lg ${
                              message.role === "user"
                                ? "bg-emerald-600 text-white rounded-tr-none"
                                : "bg-gray-100 text-gray-800 rounded-tl-none"
                            }`}
                          >
                            <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="flex items-start max-w-[80%]">
                        <div className="flex items-center justify-center w-8 h-8 mr-2 bg-gray-200 rounded-full">
                          <Bot className="w-4 h-4 text-gray-700" />
                        </div>
                        <div className="p-3 bg-gray-100 rounded-lg text-gray-800 rounded-tl-none">
                          <div className="flex space-x-1">
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              <CardFooter className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex w-full space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about product prices, comparisons, or recommendations..."
                    className="flex-grow"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Send className="w-4 h-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2 text-emerald-600" />
                  Price Analysis {activeProduct && `for ${activeProduct}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeProduct ? (
                  <div className="space-y-6">
                    <PriceChart productName={activeProduct} />
                    <PricePrediction productName={activeProduct} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-gray-500">Ask about a specific product in the chat to see its price analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compare" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-emerald-600" />
                  Product Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductComparison />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-4 text-center text-sm text-gray-500 border-t">
        <p>Smart Shopping Assistant - Helping you find the best deals</p>
      </footer>
    </div>
  )
}
