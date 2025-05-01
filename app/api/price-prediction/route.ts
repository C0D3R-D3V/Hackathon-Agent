import { NextResponse } from "next/server"
import { getPricePrediction } from "@/lib/product-data-processor"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const product = url.searchParams.get("product")

    if (!product) {
      return NextResponse.json({ error: "Product parameter is required" }, { status: 400 })
    }

    const { predictions, bestBuyDate, priceDirection } = await getPricePrediction(product)

    return NextResponse.json({ predictions, bestBuyDate, priceDirection })
  } catch (error) {
    console.error("Error fetching price prediction:", error)
    return NextResponse.json({ error: "Failed to fetch price prediction" }, { status: 500 })
  }
}
