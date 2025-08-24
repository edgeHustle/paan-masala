import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const { id } = await request.json()

        if (!id) {
            return NextResponse.json({ error: "Id is required" }, { status: 400 })
        }

        const { db } = await connectToDatabase()
        const transaction = await db.collection("transactions").findOne({
            _id: new ObjectId(id),
        })

        if (!transaction) {
            return NextResponse.json({ error: "Invalid transaction" }, { status: 401 })
        }

        const customer = await db.collection("customers").findOne({
            _id: transaction.customerId,
        })

        const response = NextResponse.json({
            success: true,
            transaction: { ...transaction, customerName: customer?.name, customerSerialNumber: customer?.serialNumber }
        })

        return response;
    } catch (error) {
        console.error("Transation fetch error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}