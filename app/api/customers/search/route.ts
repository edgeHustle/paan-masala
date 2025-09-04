import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/app/api/utils/mongodb"
import { getUserFromRequest } from "@/app/api/utils/auth"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || (user.role !== "admin" && user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const value = searchParams.get("query")

    if (!value) {
      return NextResponse.json({ error: "Search parameter required" }, { status: 400 })
    }

    const db = await getDatabase()
    const query: any = {
      $or: [
        { name: { $regex: value, $options: "i" } },
        { mobile: { $regex: value, $options: "i" } },
        { serialNumber: Number.parseInt(value) },
      ],
    }

    const customer = await db.collection("customers").find(query).toArray()

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error("Error searching customer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
