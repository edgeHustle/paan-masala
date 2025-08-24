import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/app/api/utils/mongodb"
import { getUserFromRequest } from "@/app/api/utils/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || (user.role !== "admin" && user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const customers = await db.collection("customers").find({}).sort({ serialNumber: 1 }).toArray()

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
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

    // Check if mobile number already exists
    const existingCustomer = await db.collection("customers").findOne({ mobile })
    if (existingCustomer) {
      return NextResponse.json({ error: "Customer with this mobile number already exists" }, { status: 400 })
    }

    // Get next serial number
    const lastCustomer = await db.collection("customers").findOne({}, { sort: { serialNumber: -1 } })

    const nextSerialNumber = lastCustomer ? lastCustomer.serialNumber + 1 : 1

    // Create customer
    const customer = {
      serialNumber: nextSerialNumber,
      name: name.trim(),
      mobile: mobile.trim(),
      password: await bcrypt.hash(mobile.trim(), 12),
      address: address?.trim() || "",
      createdAt: new Date(),
    }

    const result = await db.collection("customers").insertOne(customer)

    return NextResponse.json(
      {
        _id: result.insertedId,
        ...customer,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
