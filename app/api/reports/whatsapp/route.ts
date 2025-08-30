import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/app/api/utils/mongodb"
import { getUserFromRequest } from "@/app/api/utils/auth"
import { format } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    const user: any = getUserFromRequest(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { customerId, from, to } = await request.json()

    if (!customerId || !from || !to) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const db = await getDatabase()

    // Get customer and transactions
    const customer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) })
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)

    const transactions = await db
      .collection("transactions")
      .find({
        customerId: new ObjectId(customerId),
        createdAt: {
          $gte: fromDate,
          $lte: toDate,
        },
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Calculate totals
    const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0)
    const totalAdvance = transactions.reduce((sum, t) => sum + (t.advancePayment || 0), 0)
    const remainingAmount = transactions.reduce((sum, t) => sum + t.remainingAmount, 0)

    // Generate WhatsApp message
    const message = generateWhatsAppMessage({
      customer,
      transactions,
      dateRange: { from: fromDate, to: toDate },
      totals: { totalAmount, totalAdvance, remainingAmount },
    })

    // In a real implementation, you would integrate with WhatsApp Business API
    // For now, we'll simulate sending the message
    // console.log("WhatsApp message to", customer.mobile, ":", message)

    // You could also generate and attach a PDF here
    // const pdfBuffer = await generatePDF(...)
    const whatsappUrl = `https://wa.me/${customer.mobile.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`

    return NextResponse.json({
      success: true,
      message: "Statement sent successfully",
      recipient: customer.mobile,
      whatsappURL: whatsappUrl
    })
  } catch (error) {
    console.error("Error sending WhatsApp message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateWhatsAppMessage({
  customer,
  dateRange,
  totals,
}: {
  customer: any;
  transactions: any[];
  dateRange: { from: Date; to: Date };
  totals: { totalAmount: number; totalAdvance: number; remainingAmount: number };
}) {
  const periodText = `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`;

  const message = `
*${process.env.BUSINESS_NAME}*
*Account Statement*
📅${periodText}

👤 *Customer:* ${customer.name}
🔢 *Customer ID:* ${customer.serialNumber}
📱 *Mobile:* ${customer.mobile}


💰 *Account Summary:*
• Total Purchases: ₹${totals.totalAmount}
• Amount Paid: ₹${totals.totalAdvance}
• ${totals.remainingAmount < 0 ? "Balance:" : "Outstanding:"} ₹${Math.abs(totals.remainingAmount)}

Thank you! 🙏
    `.trim()

  return message;
}
