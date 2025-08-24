import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/api/utils/mongodb"
import { getUserFromRequest } from "@/app/api/utils/auth"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || user.type !== "staff") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - 6)

    const [
      totalCustomers,
      totalItems,
      todayTransactions,
      monthlyRevenueAgg,
      recentTransactions,
      topCustomers,
      paidVsPendingAgg,
      weeklyRevenueChart,
      weeklyTxnCounts
    ] = await Promise.all([

      db.collection("customers").countDocuments(),
      db.collection("items").countDocuments(),
      db.collection("transactions").countDocuments({ createdAt: { $gte: startOfDay } }),

      // Monthly total revenue
      db.collection("transactions").aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]).toArray(),

      // Recent transactions
      db.collection("transactions").aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "customers",
            localField: "customerId",
            foreignField: "_id",
            as: "customer"
          }
        },
        { $addFields: { customer: { $arrayElemAt: ["$customer", 0] } } },
        {
          $addFields: {
            customerName: "$customer.name",
            customerSerialNumber: "$customer.serialNumber"
          }
        },
        {
          $project: {
            items: 1,
            totalAmount: 1,
            advancePayment: 1,
            remainingAmount: 1,
            createdAt: 1,
            customerName: 1,
            customerSerialNumber: 1
          }
        }
      ]).toArray(),

      // Top customers by pendingAmount
      db.collection("transactions").aggregate([
        {
          $match: {
            remainingAmount: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: "$customerId",
            totalDue: { $sum: "$remainingAmount" }  // renamed to avoid conflict
          }
        },
        {
          $sort: { totalDue: -1 }
        },
        {
          $limit: 5
        },
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "_id",
            as: "customer"
          }
        },
        {
          $addFields: {
            customer: { $arrayElemAt: ["$customer", 0] }
          }
        },
        {
          $project: {
            name: "$customer.name",
            due: "$totalDue"
          }
        }
      ]).toArray(),

      // Paid vs pending aggregation
      db.collection("transactions").aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            paid: { $sum: "$advancePayment" },
            pending: { $sum: "$remainingAmount" }
          }
        }
      ]).toArray(),

      // Weekly revenue breakdown for chart
      db.collection("transactions").aggregate([
        {
          $match: {
            createdAt: { $gte: startOfWeek }
          }
        },
        {
          $project: {
            day: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            advancePayment: 1,
            remainingAmount: 1
          }
        },
        {
          $group: {
            _id: "$day",
            paid: { $sum: "$advancePayment" },
            due: { $sum: "$remainingAmount" }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).toArray(),

      // Weekly transaction counts
      db.collection("transactions").aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        {
          $project: {
            day: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            }
          }
        },
        {
          $group: {
            _id: "$day",
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray()
    ])

    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0
    const paid = paidVsPendingAgg[0]?.paid || 0
    const pending = paidVsPendingAgg[0]?.pending || 0

    const paidVsPending = [
      { name: "Paid", value: paid },
      { name: "Pending", value: pending }
    ]

    const results = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      const dayStr = `${yyyy}-${mm}-${dd}`

      const found = weeklyRevenueChart.find(entry => entry._id === dayStr)
      results.push({
        day: dayStr,
        paid: found?.paid || 0,
        due: found?.due || 0
      })
    }

    return NextResponse.json({
      totalCustomers,
      totalItems,
      todayTransactions,
      monthlyRevenue,
      recentTransactions,
      topCustomers: topCustomers,
      paidVsPending,
      weeklyRevenueChart: results,
      weeklyTxnCounts
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
