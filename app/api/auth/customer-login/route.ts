import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/api/utils/mongodb"
import { comparePassword, generateToken } from "@/app/api/utils/auth"

export async function POST(request: NextRequest) {
  try {
    const { serialNumber, password } = await request.json()

    if (!serialNumber || !password) {
      return NextResponse.json({ error: "Serial number or password is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const customer = await db.collection("customers").findOne({
      serialNumber: Number.parseInt(serialNumber),
    })

    if (!customer) {
      return NextResponse.json({ error: "Invalid serial number or password" }, { status: 401 })
    }

    const isValidPassword = await comparePassword(password, customer.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateToken(
      {
        _id: customer._id.toString(),
        serialNumber: customer.serialNumber,
        name: customer.name,
        mobile: customer.mobile,
      },
      "customer",
    )

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        _id: customer._id,
        username: customer.serialNumber.toString(),
        name: customer.name,
        role: "customer",
        serialNumber: customer.serialNumber,
      },
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("Customer login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
