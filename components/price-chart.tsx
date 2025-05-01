"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

type PriceData = {
  date: string
  [seller: string]: number | string
}

type PriceChartProps = {
  productName: string
}

export default function PriceChart({ productName }: PriceChartProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [timeRange, setTimeRange] = useState("1m")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPriceData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/price-history?product=${encodeURIComponent(productName)}&range=${timeRange}`)

        if (!response.ok) {
          throw new Error("Failed to fetch price data")
        }

        const data = await response.json()
        setPriceData(data.priceHistory)
      } catch (err) {
        console.error("Error fetching price data:", err)
        setError("Failed to load price history. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPriceData()
  }, [productName, timeRange])

  // Colors for different sellers
  const sellerColors = {
    Daraz: "#f85606",
    PriceOye: "#0066ff",
    MegaPK: "#00b300",
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>Loading price data...</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div
              className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>Error</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // If we have no data
  if (!priceData || priceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>No price data available</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-gray-500">No historical price data available for this product.</p>
        </CardContent>
      </Card>
    )
  }

  // Extract seller names from the first data point
  const sellers = Object.keys(priceData[0]).filter((key) => key !== "date")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Price History</CardTitle>
          <CardDescription>Track how prices have changed over time</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">1 Month</SelectItem>
            <SelectItem value="3m">3 Months</SelectItem>
            <SelectItem value="6m">6 Months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`Rs. ${value}`, ""]} />
              <Legend />
              {sellers.map((seller, index) => (
                <Line
                  key={seller}
                  type="monotone"
                  dataKey={seller}
                  name={seller}
                  stroke={
                    sellerColors[seller as keyof typeof sellerColors] ||
                    `#${Math.floor(Math.random() * 16777215).toString(16)}`
                  }
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-2">Price Insights:</h3>
          <ul className="space-y-1 text-sm">
            <li>
              • Lowest price:{" "}
              <span className="font-medium text-green-600">
                Rs.{" "}
                {Math.min(
                  ...priceData.flatMap((data) =>
                    sellers.map((seller) =>
                      typeof data[seller] === "number" ? (data[seller] as number) : Number.POSITIVE_INFINITY,
                    ),
                  ),
                )}
              </span>
            </li>
            <li>
              • Highest price:{" "}
              <span className="font-medium text-red-600">
                Rs.{" "}
                {Math.max(
                  ...priceData.flatMap((data) =>
                    sellers.map((seller) => (typeof data[seller] === "number" ? (data[seller] as number) : 0)),
                  ),
                )}
              </span>
            </li>
            <li>
              • Best seller: <span className="font-medium text-emerald-600">Daraz</span> (lowest average price)
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
