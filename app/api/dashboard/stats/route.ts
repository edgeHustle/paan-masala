import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || user.type !== "staff") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get current date for filtering
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Fetch stats
    const [totalCustomers, totalItems, todayTransactions, monthlyTransactions, recentTransactions] = await Promise.all([
      db.collection("customers").countDocuments(),
      db.collection("items").countDocuments(),
      db.collection("transactions").countDocuments({
        createdAt: { $gte: startOfDay },
      }),
      db
        .collection("transactions")
        .aggregate([
          {
            $match: {
              createdAt: { $gte: startOfMonth },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalAmount" },
            },
          },
        ])
        .toArray(),
      db
        .collection("transactions")
        .find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),
    ])

    const monthlyRevenue = monthlyTransactions.length > 0 ? monthlyTransactions[0].total : 0

    return NextResponse.json({
      totalCustomers,
      totalItems,
      todayTransactions,
      monthlyRevenue,
      recentTransactions
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
