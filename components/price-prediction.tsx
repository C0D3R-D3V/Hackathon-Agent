"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, TrendingDown, TrendingUp } from "lucide-react"

type PredictionData = {
  date: string
  predicted: number
  lowerBound: number
  upperBound: number
}

type PricePredictionProps = {
  productName: string
}

export default function PricePrediction({ productName }: PricePredictionProps) {
  const [predictionData, setPredictionData] = useState<PredictionData[]>([])
  const [bestBuyDate, setBestBuyDate] = useState<string | null>(null)
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | "stable">("stable")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPredictionData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/price-prediction?product=${encodeURIComponent(productName)}`)

        if (!response.ok) {
          throw new Error("Failed to fetch prediction data")
        }

        const data = await response.json()
        setPredictionData(data.predictions)
        setBestBuyDate(data.bestBuyDate)
        setPriceDirection(data.priceDirection)
      } catch (err) {
        console.error("Error fetching prediction data:", err)
        setError("Failed to load price predictions. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPredictionData()
  }, [productName])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Prediction</CardTitle>
          <CardDescription>Loading prediction data...</CardDescription>
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
          <CardTitle>Price Prediction</CardTitle>
          <CardDescription>Error</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // If we have no data
  if (!predictionData || predictionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Prediction</CardTitle>
          <CardDescription>No prediction data available</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-gray-500">No price prediction data available for this product.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Price Prediction</CardTitle>
            <CardDescription>Forecasted prices for the next 30 days</CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`flex items-center ${
              priceDirection === "down"
                ? "bg-green-50 text-green-700 border-green-200"
                : priceDirection === "up"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
            }`}
          >
            {priceDirection === "down" ? (
              <TrendingDown className="w-3 h-3 mr-1" />
            ) : priceDirection === "up" ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : null}
            Price trend: {priceDirection === "down" ? "Decreasing" : priceDirection === "up" ? "Increasing" : "Stable"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={predictionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`Rs. ${value}`, ""]} />
              <Legend />
              <Line type="monotone" dataKey="predicted" name="Predicted Price" stroke="#10b981" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="lowerBound" name="Lower Bound" stroke="#d1d5db" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="upperBound" name="Upper Bound" stroke="#d1d5db" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {bestBuyDate && (
          <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-emerald-600" />
              <h3 className="font-medium text-emerald-800">Recommended Purchase Date</h3>
            </div>
            <p className="mt-2 text-emerald-700">
              The best time to buy this product is on <span className="font-bold">{bestBuyDate}</span> for the lowest
              predicted price.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
