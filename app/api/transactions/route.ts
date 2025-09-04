import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/app/api/utils/mongodb"
import { getUserFromRequest } from "@/app/api/utils/auth"

export async function GET(request: NextRequest) {
  try {
    const user: any = getUserFromRequest(request)
    if (!user || (user.role !== "admin" && user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()

    // Get transactions with customer details
    const transactions = await db
      .collection("transactions")
      .aggregate([
        {
          $lookup: {
            from: "customers",
            localField: "customerId",
            foreignField: "_id",
            as: "customer",
          },
        },
        {
          $unwind: "$customer",
        },
        {
          $addFields: {
            customerName: "$customer.name",
            customerSerialNumber: "$customer.serialNumber",
          },
        },
        {
          $project: {
            customer: 0,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 5,
        },
      ])
      .toArray()

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user: any = getUserFromRequest(request)
    if (!user || (user.role !== "admin" && user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { customerId, items, totalAmount, advancePayment, remainingAmount } = await request.json()
    if (!customerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!advancePayment && !items.length) {
      return NextResponse.json({ error: "Add either advance payment or items" }, { status: 400 })
    }

    if (totalAmount < 0) {
      return NextResponse.json({ error: "Total amount must be positive" }, { status: 400 })
    }

    const db = await getDatabase()

    // Verify customer exists
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) })
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Create transaction
    const transaction = {
      customerId: new ObjectId(customerId),
      items: items.map((item: any) => ({
        itemId: item.itemId.includes("custom") ? new ObjectId() : new ObjectId(item.itemId),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        isCustom: item.isCustom || false,
      })),
      totalAmount: totalAmount || 0,
      advancePayment: advancePayment || 0,
      remainingAmount: remainingAmount || totalAmount,
      createdAt: new Date(),
      createdBy: user.userId,
    }

    const result = await db.collection("transactions").insertOne(transaction)

    return NextResponse.json(
      {
        _id: result.insertedId,
        ...transaction,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
