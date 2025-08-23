import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { format } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
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
    console.log("WhatsApp message to", customer.mobile, ":", message)

    // You could also generate and attach a PDF here
    // const pdfBuffer = await generatePDF(...)

    return NextResponse.json({
      success: true,
      message: "Statement sent successfully",
      recipient: customer.mobile,
    })
  } catch (error) {
    console.error("Error sending WhatsApp message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateWhatsAppMessage({
  customer,
  transactions,
  dateRange,
  totals,
}: {
  customer: any
  transactions: any[]
  dateRange: { from: Date; to: Date }
  totals: { totalAmount: number; totalAdvance: number; remainingAmount: number }
}) {
  const periodText = `${format(dateRange.from, "dd/MM/yyyy")} to ${format(dateRange.to, "dd/MM/yyyy")}`

  let message = `🧾 *Account Statement*\n\n`
  message += `Dear ${customer.name},\n\n`
  message += `Here is your account statement for the period:\n`
  message += `📅 *${periodText}*\n\n`

  message += `📊 *Summary:*\n`
  message += `• Total Transactions: ${transactions.length}\n`
  message += `• Total Amount: ₹${totals.totalAmount.toLocaleString()}\n`
  message += `• Advance Paid: ₹${totals.totalAdvance.toLocaleString()}\n`

  if (totals.remainingAmount > 0) {
    message += `• *Outstanding: ₹${totals.remainingAmount.toLocaleString()}*\n\n`
    message += `⚠️ Please settle the outstanding amount at your earliest convenience.\n\n`
  } else {
    message += `• Outstanding: ₹0\n\n`
    message += `✅ Your account is up to date. Thank you!\n\n`
  }

  if (transactions.length > 0) {
    message += `📋 *Recent Transactions:*\n`
    transactions.slice(0, 5).forEach((transaction) => {
      const date = format(new Date(transaction.createdAt), "dd/MM")
      const itemCount = transaction.items.length
      message += `• ${date}: ${itemCount} item(s) - ₹${transaction.totalAmount.toFixed(2)}\n`
    })

    if (transactions.length > 5) {
      message += `... and ${transactions.length - 5} more transactions\n`
    }
  }

  message += `\n📞 For any queries, please contact us.\n`
  message += `Thank you for your business! 🙏`

  return message
}
