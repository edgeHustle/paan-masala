import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Customer, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token) as Customer;
    if (!decoded || decoded.type !== "customer") {
      return NextResponse.json({ error: "Invalid access" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get customer data
    const customer = await db.collection("customers").findOne({
      serialNumber: decoded.serialNumber,
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Get customer transactions
    const transactions = await db
      .collection("transactions")
      .find({ customerId: new ObjectId(customer._id) })
      .sort({ createdAt: -1 })
      .toArray()

    // Calculate stats
    const stats = await db
      .collection("transactions")
      .aggregate([
        { $match: { customerId: new ObjectId(customer._id) } },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
            totalAdvance: { $sum: "$advancePayment" },
            outstandingAmount: { $sum: "$remainingAmount" },
          },
        },
      ])
      .toArray()

    const customerStats = stats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      totalAdvance: 0,
      outstandingAmount: 0,
    }

    return NextResponse.json({
      customer: {
        _id: customer._id,
        serialNumber: customer.serialNumber,
        name: customer.name,
        mobile: customer.mobile,
        address: customer.address,
        createdAt: customer.createdAt,
      },
      transactions,
      stats: customerStats,
    })
  } catch (error) {
    console.error("Customer portal data error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
