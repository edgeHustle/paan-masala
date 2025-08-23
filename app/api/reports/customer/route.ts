import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!customerId || !from || !to) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const db = await getDatabase()

    // Verify customer exists
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) })
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)

    // Get transactions for the customer in the date range
    const transactions = await db
      .collection("transactions")
      .find({
        customerId: new ObjectId(customerId),
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Calculate summary statistics
    const totalTransactions = transactions.length
    const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0)
    const totalAdvance = transactions.reduce((sum, t) => sum + (t.advancePayment || 0), 0)
    const remainingAmount = transactions.reduce((sum, t) => sum + t.remainingAmount, 0)

    return NextResponse.json({
      customer,
      dateRange: { from: fromDate, to: toDate },
      totalTransactions,
      totalAmount,
      totalAdvance,
      remainingAmount,
      transactions,
    })
  } catch (error) {
    console.error("Error generating customer report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
