import { NextResponse } from "next/server"
import { getPriceHistory } from "@/lib/product-data-processor"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const product = url.searchParams.get("product")
    const range = url.searchParams.get("range") || "1m"

    if (!product) {
      return NextResponse.json({ error: "Product parameter is required" }, { status: 400 })
    }

    const priceHistory = await getPriceHistory(product, range)

    return NextResponse.json({ priceHistory })
  } catch (error) {
    console.error("Error fetching price history:", error)
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 })
  }
}
