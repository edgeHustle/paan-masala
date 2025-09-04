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
    const queryParam = searchParams.get("query") // unified param (serial or name or mobile)

    if (!queryParam) {
      return NextResponse.json({ error: "Search parameter required" }, { status: 400 })
    }

    const db = await getDatabase()
    const customersCollection = db.collection("customers")

    let query: any = {}

    if (!isNaN(Number(queryParam))) {
      query.serialNumber = Number(queryParam)
    } else {
      query = {
        $or: [
          { name: { $regex: queryParam, $options: "i" } },
          { mobile: { $regex: queryParam, $options: "i" } }
        ]
      }
    }

    const customers = await customersCollection.find(query).limit(10).toArray()

    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error searching customer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
