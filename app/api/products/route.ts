import { NextResponse } from "next/server"
import { getProductsByCategory } from "@/lib/product-data-processor"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get("category")

    if (!category) {
      return NextResponse.json({ error: "Category parameter is required" }, { status: 400 })
    }

    const products = await getProductsByCategory(category)

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
