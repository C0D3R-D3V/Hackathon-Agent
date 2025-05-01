import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { processQuery } from "@/lib/product-data-processor"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { query } = await req.json()

    // Process the query to extract product information and generate a response
    const { response, product, productData } = await processQuery(query)

    // If we have product data, we can use it to generate a more detailed response
    if (productData) {
      // Return the processed response directly
      return NextResponse.json({
        response,
        product,
        productData,
      })
    } else {
      // Use AI to generate a response if we don't have specific product data
      const result = await streamText({
        model: openai("gpt-4o"),
        system: `You are an AI shopping assistant designed to help users with their shopping needs.
        
        Your capabilities include:
        - Providing product recommendations based on user preferences and needs
        - Comparing different products and their features
        - Offering information about current shopping trends
        - Suggesting gift ideas based on recipient preferences
        - Helping users find the best deals
        
        Always be helpful, concise, and focused on shopping-related queries. If a user asks about something unrelated to shopping, politely redirect them to shopping-related topics.
        
        Do not make up specific prices or availability for products unless explicitly stated in the conversation. Instead, provide general price ranges and suggest that the user check current prices at retailers.
        
        Always maintain a friendly, helpful tone and focus on providing value to the shopper.`,
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
      })

      const text = await result.text

      return NextResponse.json({
        response: text,
        product: null,
      })
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
