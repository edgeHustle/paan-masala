import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/app/api/utils/mongodb"
import { getUserFromRequest } from "@/app/api/utils/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request)
    if (!user || (user.role !== "admin" && user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const customerId = new ObjectId(id)

    // Get transaction statistics
    const stats = await db
      .collection("transactions")
      .aggregate([
        { $match: { customerId } },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
            lastTransactionDate: { $max: "$createdAt" },
          },
        },
      ])
      .toArray()

    const result =
      stats.length > 0
        ? stats[0]
        : {
          totalTransactions: 0,
          totalAmount: 0,
          lastTransactionDate: null,
        }

    return NextResponse.json({
      totalTransactions: result.totalTransactions,
      totalAmount: result.totalAmount,
      lastTransactionDate: result.lastTransactionDate,
    })
  } catch (error) {
    console.error("Error fetching customer stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
