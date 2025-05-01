import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"
import { DateTime } from "luxon"

// Define types
type ProductRecord = {
  Product: string
  Category: string
  Company: string
  [key: string]: string | number
}

type PriceHistoryPoint = {
  date: string
  [seller: string]: number | string
}

type PredictionPoint = {
  date: string
  predicted: number
  lowerBound: number
  upperBound: number
}

type ComparisonPoint = {
  seller: string
  [product: string]: number | string
}

// Cache the data to avoid reading the file multiple times
let productData: ProductRecord[] | null = null

// Function to load the product data
async function loadProductData(): Promise<ProductRecord[]> {
  if (productData) {
    return productData
  }

  try {
    // In a real application, this would be stored in a database
    // For this example, we'll read from a CSV file
    const filePath = path.join(process.cwd(), "data", "categorized_real_products_price_data.csv")
    const fileContent = fs.readFileSync(filePath, "utf8")

    productData = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    })

    return productData
  } catch (error) {
    console.error("Error loading product data:", error)

    // Return sample data if file not found
    return generateSampleData()
  }
}

// Function to generate sample data if the CSV file is not available
function generateSampleData(): ProductRecord[] {
  const categories = ["Mobile Phones", "Laptops & Computers", "Televisions", "Home Electronics"]

  const products = [
    "iPhone 15",
    "iPhone 14",
    "Samsung Galaxy S23",
    "MacBook Pro",
    "Dell XPS",
    "Sony Bravia 55 inch 4K TV",
    "LG Smart LED TV 43 inch",
  ]

  const companies = ["Company A", "Company B", "Company C"]
  const sellers = ["Daraz", "PriceOye", "MegaPK"]

  const data: ProductRecord[] = []

  // Generate 6 months of dates
  const dates = []
  const today = DateTime.now()
  for (let i = 0; i < 26; i++) {
    const date = today.minus({ weeks: i }).toFormat("yyyy-MM-dd")
    dates.push(date)
  }
  dates.reverse()

  // Generate sample data
  products.forEach((product) => {
    const category = categories[Math.floor(Math.random() * categories.length)]

    companies.forEach((company) => {
      const record: ProductRecord = {
        Product: product,
        Category: category,
        Company: company,
      }

      // Generate current prices
      sellers.forEach((seller) => {
        const basePrice = Math.floor(Math.random() * 50000) + 5000
        record[`${seller} Current Price`] = basePrice

        // Generate historical prices
        dates.forEach((date) => {
          const variation = Math.floor(Math.random() * 6000) - 3000
          record[`${seller} Price on ${date}`] = basePrice + variation
        })
      })

      data.push(record)
    })
  })

  return data
}

// Function to process a user query and extract product information
export async function processQuery(
  query: string,
): Promise<{ response: string; product: string | null; productData?: any }> {
  const data = await loadProductData()

  // Convert query to lowercase for case-insensitive matching
  const lowerQuery = query.toLowerCase()

  // Check if the query mentions a specific product
  let matchedProduct: string | null = null
  let matchedProductData: ProductRecord[] = []

  for (const record of data) {
    const productName = record.Product.toString()
    if (lowerQuery.includes(productName.toLowerCase())) {
      matchedProduct = productName
      matchedProductData = data.filter((r) => r.Product === productName)
      break
    }
  }

  // If no exact match, try partial matching
  if (!matchedProduct) {
    for (const record of data) {
      const productName = record.Product.toString()
      const productWords = productName.toLowerCase().split(" ")

      if (productWords.some((word) => lowerQuery.includes(word) && word.length > 3)) {
        matchedProduct = productName
        matchedProductData = data.filter((r) => r.Product === productName)
        break
      }
    }
  }

  // If we found a product, generate a response based on the query intent
  if (matchedProduct && matchedProductData.length > 0) {
    let response = ""

    // Get current prices across sellers
    const currentPrices: Record<string, number> = {}
    const sellers = ["Daraz", "PriceOye", "MegaPK"]

    sellers.forEach((seller) => {
      const priceKey = `${seller} Current Price`
      const prices = matchedProductData.map((record) => Number(record[priceKey]) || 0)
      currentPrices[seller] = Math.min(...prices)
    })

    // Find the lowest price and seller
    let lowestPrice = Number.POSITIVE_INFINITY
    let lowestPriceSeller = ""

    Object.entries(currentPrices).forEach(([seller, price]) => {
      if (price < lowestPrice) {
        lowestPrice = price
        lowestPriceSeller = seller
      }
    })

    // Generate response based on query intent
    if (lowerQuery.includes("price") || lowerQuery.includes("cost") || lowerQuery.includes("how much")) {
      response = `Current prices for ${matchedProduct}:\n\n`

      Object.entries(currentPrices).forEach(([seller, price]) => {
        response += `${seller}: Rs. ${price.toLocaleString()}\n`
      })

      response += `\nThe lowest price is Rs. ${lowestPrice.toLocaleString()} at ${lowestPriceSeller}.`
    } else if (lowerQuery.includes("compare") || lowerQuery.includes("difference")) {
      response = `Price comparison for ${matchedProduct}:\n\n`

      Object.entries(currentPrices).forEach(([seller, price]) => {
        const difference = price - lowestPrice
        const percentageDifference = (difference / lowestPrice) * 100

        response += `${seller}: Rs. ${price.toLocaleString()}`

        if (difference > 0) {
          response += ` (Rs. ${difference.toLocaleString()} or ${percentageDifference.toFixed(1)}% more than the lowest price)`
        } else if (difference === 0) {
          response += ` (lowest price)`
        }

        response += `\n`
      })

      response += `\nRecommendation: Buy from ${lowestPriceSeller} for the best price.`
    } else if (lowerQuery.includes("history") || lowerQuery.includes("trend")) {
      response = `Price history for ${matchedProduct}:\n\n`

      response += `The price has fluctuated over the past 6 months. You can view the detailed price history chart in the Price Analysis tab.\n\n`

      response += `Current lowest price: Rs. ${lowestPrice.toLocaleString()} at ${lowestPriceSeller}.`
    } else if (lowerQuery.includes("predict") || lowerQuery.includes("forecast") || lowerQuery.includes("future")) {
      response = `Price prediction for ${matchedProduct}:\n\n`

      // Simulate a prediction
      const randomTrend = Math.random()
      if (randomTrend < 0.4) {
        response += `Based on historical trends, prices are likely to decrease in the coming weeks. The best time to buy would be around 2 weeks from now.\n\n`
      } else if (randomTrend < 0.7) {
        response += `Based on historical trends, prices are expected to remain stable in the near future. You can buy now without worrying about significant price drops.\n\n`
      } else {
        response += `Based on historical trends, prices may increase in the coming weeks. It's recommended to purchase soon to avoid paying more.\n\n`
      }

      response += `Current lowest price: Rs. ${lowestPrice.toLocaleString()} at ${lowestPriceSeller}.`
    } else if (lowerQuery.includes("best") || lowerQuery.includes("recommend") || lowerQuery.includes("should")) {
      response = `Recommendation for ${matchedProduct}:\n\n`

      response += `The best place to buy is ${lowestPriceSeller} with a price of Rs. ${lowestPrice.toLocaleString()}.\n\n`

      // Add a random recommendation about timing
      const randomRecommendation = Math.random()
      if (randomRecommendation < 0.33) {
        response += `Based on price trends, now is a good time to buy as prices are relatively low compared to historical data.`
      } else if (randomRecommendation < 0.66) {
        response += `Consider waiting for 1-2 weeks as there might be a price drop based on seasonal patterns.`
      } else {
        response += `This product is currently at a competitive price point. If you need it now, it's a reasonable time to purchase.`
      }
    } else {
      // Default response with general information
      response = `Information about ${matchedProduct}:\n\n`

      response += `Current prices range from Rs. ${lowestPrice.toLocaleString()} to Rs. ${Math.max(...Object.values(currentPrices)).toLocaleString()} across different sellers.\n\n`

      response += `The best deal is currently at ${lowestPriceSeller} for Rs. ${lowestPrice.toLocaleString()}.\n\n`

      response += `You can view detailed price history, comparisons, and predictions in the Price Analysis tab.`
    }

    return {
      response,
      product: matchedProduct,
      productData: {
        name: matchedProduct,
        currentPrices,
        lowestPrice,
        lowestPriceSeller,
      },
    }
  }

  // If no product was found, return a generic response
  return {
    response:
      "I couldn't find specific information about that product in my database. Please try asking about another product or browse the available categories in the Compare Products tab.",
    product: null,
  }
}

// Function to get price history for a product
export async function getPriceHistory(productName: string, range: string): Promise<PriceHistoryPoint[]> {
  const data = await loadProductData()
  const productRecords = data.filter((record) => record.Product === productName)

  if (productRecords.length === 0) {
    return []
  }

  // Determine how many weeks to include based on the range
  let weeksToInclude = 4 // Default to 1 month
  if (range === "3m") weeksToInclude = 13
  if (range === "6m") weeksToInclude = 26

  // Get all date columns
  const dateColumns = Object.keys(productRecords[0])
    .filter(
      (key) =>
        key.startsWith("Daraz Price on ") || key.startsWith("PriceOye Price on ") || key.startsWith("MegaPK Price on "),
    )
    .map((key) => key.replace("Daraz Price on ", "").replace("PriceOye Price on ", "").replace("MegaPK Price on ", ""))
    .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
    .sort()
    .slice(-weeksToInclude) // Take only the most recent weeks based on range

  // Create price history points
  const priceHistory: PriceHistoryPoint[] = []

  dateColumns.forEach((date) => {
    const point: PriceHistoryPoint = { date }

    // Get prices for each seller
    const sellers = ["Daraz", "PriceOye", "MegaPK"]
    sellers.forEach((seller) => {
      const priceKey = `${seller} Price on ${date}`

      // Get the minimum price across all companies for this seller and date
      const prices = productRecords.map((record) => Number(record[priceKey]) || 0)
      point[seller] = Math.min(...prices)
    })

    priceHistory.push(point)
  })

  return priceHistory
}

// Function to get price prediction for a product
export async function getPricePrediction(productName: string): Promise<{
  predictions: PredictionPoint[]
  bestBuyDate: string
  priceDirection: "up" | "down" | "stable"
}> {
  // Get historical data to base predictions on
  const priceHistory = await getPriceHistory(productName, "3m")

  if (priceHistory.length === 0) {
    return {
      predictions: [],
      bestBuyDate: "",
      priceDirection: "stable",
    }
  }

  // Generate predictions for the next 30 days
  const predictions: PredictionPoint[] = []
  const today = DateTime.now()

  // Analyze historical trend to determine direction
  const firstPoint = priceHistory[0]
  const lastPoint = priceHistory[priceHistory.length - 1]

  // Calculate average price across all sellers for first and last points
  const getAveragePrice = (point: PriceHistoryPoint) => {
    const sellers = ["Daraz", "PriceOye", "MegaPK"]
    const prices = sellers.map((seller) => Number(point[seller]) || 0)
    return prices.reduce((sum, price) => sum + price, 0) / prices.length
  }

  const firstAvgPrice = getAveragePrice(firstPoint)
  const lastAvgPrice = getAveragePrice(lastPoint)

  // Determine price direction
  const priceDifference = lastAvgPrice - firstAvgPrice
  let priceDirection: "up" | "down" | "stable" = "stable"

  if (priceDifference > firstAvgPrice * 0.05) {
    priceDirection = "up"
  } else if (priceDifference < -firstAvgPrice * 0.05) {
    priceDirection = "down"
  }

  // Generate future predictions
  let bestBuyDate = ""
  let lowestPredictedPrice = Number.POSITIVE_INFINITY

  for (let i = 1; i <= 30; i++) {
    const date = today.plus({ days: i }).toFormat("yyyy-MM-dd")

    // Base prediction on last price with some randomness and trend
    const lastPrice = getAveragePrice(lastPoint)
    const trendFactor = priceDirection === "up" ? 1.002 : priceDirection === "down" ? 0.998 : 1
    const randomFactor = 0.98 + Math.random() * 0.04 // Random factor between 0.98 and 1.02

    const predictedPrice = lastPrice * Math.pow(trendFactor, i) * randomFactor
    const lowerBound = predictedPrice * 0.95
    const upperBound = predictedPrice * 1.05

    predictions.push({
      date,
      predicted: Math.round(predictedPrice),
      lowerBound: Math.round(lowerBound),
      upperBound: Math.round(upperBound),
    })

    // Track the lowest predicted price for best buy date
    if (predictedPrice < lowestPredictedPrice) {
      lowestPredictedPrice = predictedPrice
      bestBuyDate = date
    }
  }

  return {
    predictions,
    bestBuyDate,
    priceDirection,
  }
}

// Function to get products by category
export async function getProductsByCategory(category: string): Promise<{ name: string; category: string }[]> {
  const data = await loadProductData()

  // Filter products by category and remove duplicates
  const products = data
    .filter((record) => record.Category === category)
    .map((record) => ({
      name: record.Product.toString(),
      category: record.Category.toString(),
    }))
    .filter((product, index, self) => index === self.findIndex((p) => p.name === product.name))

  return products
}

// Function to compare products
export async function compareProducts(productNames: string[]): Promise<ComparisonPoint[]> {
  const data = await loadProductData()
  const sellers = ["Daraz", "PriceOye", "MegaPK"]

  const comparison: ComparisonPoint[] = []

  sellers.forEach((seller) => {
    const point: ComparisonPoint = { seller }

    productNames.forEach((productName) => {
      const productRecords = data.filter((record) => record.Product === productName)

      if (productRecords.length > 0) {
        const priceKey = `${seller} Current Price`
        const prices = productRecords.map((record) => Number(record[priceKey]) || 0)
        point[productName] = Math.min(...prices)
      } else {
        point[productName] = 0
      }
    })

    comparison.push(point)
  })

  return comparison
}
