import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/app/api/utils/mongodb"
import { getUserFromRequest, User } from "@/app/api/utils/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request) as User;
    if (!user || (user.role !== "admin" && user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const customer = await db.collection("customers").findOne({
      _id: new ObjectId(id),
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error fetching customer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request) as User;
    if (!user || (user.role !== "admin" && user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, mobile, address } = await request.json()

    if (!name || !mobile) {
      return NextResponse.json({ error: "Name and mobile are required" }, { status: 400 })
    }

    // Validate mobile number format
    if (!/^[0-9]{10}$/.test(mobile)) {
      return NextResponse.json({ error: "Mobile number must be 10 digits" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if mobile number already exists for another customer
    const existingCustomer = await db.collection("customers").findOne({
      mobile,
      _id: { $ne: new ObjectId(id) },
    })

    if (existingCustomer) {
      return NextResponse.json({ error: "Customer with this mobile number already exists" }, { status: 400 })
    }

    const result = await db.collection("customers").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: name.trim(),
          mobile: mobile.trim(),
          address: address?.trim() || "",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request) as User;
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()

    // Check if customer has transactions
    const transactionCount = await db.collection("transactions").countDocuments({
      customerId: new ObjectId(id),
    })

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete customer with existing transactions",
        },
        { status: 400 },
      )
    }

    const result = await db.collection("customers").deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting customer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
