"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

type Product = {
  name: string
  category: string
}

type ComparisonData = {
  seller: string
  [product: string]: number | string
}

export default function ProductComparison() {
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch categories
  const categories = [
    "Mobile Phones",
    "Laptops & Computers",
    "Computer Accessories",
    "Storage Devices",
    "Mobile Accessories",
    "Televisions",
    "Refrigerators",
    "Washing Machines",
    "Air Conditioners",
    "Kitchen Appliances",
    "Home Electronics",
  ]

  // Handle category selection
  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category)
    setSelectedProducts([])
    setComparisonData([])
    setIsLoading(true)

    try {
      const response = await fetch(`/api/products?category=${encodeURIComponent(category)}`)

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      setAvailableProducts(data.products)
    } catch (err) {
      console.error("Error fetching products:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle product selection
  const handleProductSelect = (product: string) => {
    if (selectedProducts.includes(product)) {
      setSelectedProducts(selectedProducts.filter((p) => p !== product))
    } else if (selectedProducts.length < 3) {
      setSelectedProducts([...selectedProducts, product])
    }
  }

  // Handle comparison
  const handleCompare = async () => {
    if (selectedProducts.length === 0) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products: selectedProducts }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch comparison data")
      }

      const data = await response.json()
      setComparisonData(data.comparison)
    } catch (err) {
      console.error("Error fetching comparison data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Colors for different products
  const productColors = ["#10b981", "#3b82f6", "#f97316"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Category</label>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategory && (
          <div>
            <label className="block text-sm font-medium mb-1">Select Products to Compare (max 3)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {isLoading ? (
                <p>Loading products...</p>
              ) : (
                availableProducts.map((product) => (
                  <Button
                    key={product.name}
                    variant={selectedProducts.includes(product.name) ? "default" : "outline"}
                    className={selectedProducts.includes(product.name) ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    onClick={() => handleProductSelect(product.name)}
                  >
                    {product.name}
                  </Button>
                ))
              )}
            </div>
          </div>
        )}

        {selectedProducts.length > 0 && (
          <Button onClick={handleCompare} className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
            Compare Products
          </Button>
        )}
      </div>

      {comparisonData.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">Price Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="seller" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rs. ${value}`, ""]} />
                  <Legend />
                  {selectedProducts.map((product, index) => (
                    <Bar key={product} dataKey={product} name={product} fill={productColors[index]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Best Deals:</h3>
              <ul className="space-y-2">
                {selectedProducts.map((product) => {
                  const bestSeller = comparisonData.reduce((best, current) => {
                    return (current[product] as number) < (best[product] as number) ? current : best
                  })

                  return (
                    <li key={product} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{product}</span>
                      <span className="font-medium">
                        Best at <span className="text-emerald-600">{bestSeller.seller}</span>:
                        <span className="ml-1 text-emerald-700">Rs. {bestSeller[product]}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
