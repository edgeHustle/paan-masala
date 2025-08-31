import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/api/utils/mongodb"
import { verifyToken } from "@/app/api/utils/auth"

export async function POST(request: NextRequest) {
  try {
    const { serialNumber, from, to } = await request.json();
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded: any = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Invalid access" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get customer data
    const customer = await db.collection("customers").findOne({
      serialNumber: serialNumber,
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Get recent transactions
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const transactions = await db
      .collection("transactions")
      .find({
        customerId: customer._id,
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Calculate totals
    const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0)
    const totalAdvance = transactions.reduce((sum, t) => sum + t.advancePayment, 0)
    const outstandingAmount = transactions.reduce((sum, t) => sum + t.remainingAmount, 0)

    // Create WhatsApp message
    const messageOld = `
🏪 *${process.env.NEXT_PUBLIC_BUSINESS_NAME} - Account Statement*

👤 *Customer:* ${customer.name}
🔢 *Serial Number:* ${customer.serialNumber}
📱 *Mobile:* ${customer.mobile}
📅 *Date:* ${new Date().toLocaleDateString()}

💰 *Account Summary:*
• Total Purchases: ₹${totalAmount}
• Amount Paid: ₹${totalAdvance}
• Outstanding: ₹${outstandingAmount}

📋 *Recent Transactions:*
${transactions
        .slice(0, 5)
        .map(
          (t) =>
            `• ${new Date(t.createdAt).toLocaleDateString()} - ₹${t.totalAmount} ${t.remainingAmount > 0 ? `(₹${t.remainingAmount} pending)` : "(Paid)"}`,
        )
        .join("\n")}

${transactions.length > 5 ? `\n... and ${transactions.length - 5} more transactions` : ""}

Thank you for your business! 🙏
    `.trim()

    const message = `
🏪 *${process.env.NEXT_PUBLIC_BUSINESS_NAME} - Account Statement*

👤 *Customer:* ${customer.name}
🔢 *Serial Number:* ${customer.serialNumber}
📱 *Mobile:* ${customer.mobile}
📅 *Date:* ${new Date().toLocaleDateString()}

💰 *Account Summary:*
• Total Purchases: ₹${totalAmount}
• Amount Paid: ₹${totalAdvance}
• ${outstandingAmount < 0 ? "Balance:" : "Outstanding:"} ₹${Math.abs(outstandingAmount)}

Thank you for your business! 🙏
    `.trim()

    // In production, integrate with WhatsApp Business API
    // For now, we'll create a WhatsApp URL
    const whatsappUrl = `https://wa.me/${customer.mobile.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`

    return NextResponse.json({
      success: true,
      message: "Statement sent to WhatsApp",
      whatsappUrl, // In development, you could return this for testing
    })
  } catch (error) {
    console.error("WhatsApp statement error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
