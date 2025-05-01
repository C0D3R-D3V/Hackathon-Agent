import { NextResponse } from "next/server"
import { compareProducts } from "@/lib/product-data-processor"

export async function POST(req: Request) {
  try {
    const { products } = await req.json()

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Products array is required" }, { status: 400 })
    }

    const comparison = await compareProducts(products)

    return NextResponse.json({ comparison })
  } catch (error) {
    console.error("Error comparing products:", error)
    return NextResponse.json({ error: "Failed to compare products" }, { status: 500 })
  }
}
