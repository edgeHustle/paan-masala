import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || (user.role !== "admin" && user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const serialNumber = searchParams.get("serialNumber")
    const name = searchParams.get("name")
    const mobile = searchParams.get("mobile")

    if (!serialNumber && !name && !mobile) {
      return NextResponse.json({ error: "Search parameter required" }, { status: 400 })
    }

    const db = await getDatabase()
    const query: any = {}

    if (serialNumber) {
      query.serialNumber = Number.parseInt(serialNumber)
    } else if (name) {
      query.name = { $regex: name, $options: "i" }
    } else if (mobile) {
      query.mobile = mobile
    }

    const customer = await db.collection("customers").findOne(query)

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error searching customer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
