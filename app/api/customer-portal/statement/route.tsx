import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "customer") {
      return NextResponse.json({ error: "Invalid access" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get customer data
    const customer = await db.collection("customers").findOne({
      serialNumber: decoded.serialNumber,
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Get all transactions
    const transactions = await db
      .collection("transactions")
      .find({ customerId: customer._id.toString() })
      .sort({ createdAt: -1 })
      .toArray()

    // Generate PDF content (simplified HTML for PDF generation)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Account Statement - ${customer.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .customer-info { margin-bottom: 20px; }
            .transactions { width: 100%; border-collapse: collapse; }
            .transactions th, .transactions td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .transactions th { background-color: #f2f2f2; }
            .total { font-weight: bold; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pan Masala Business</h1>
            <h2>Account Statement</h2>
          </div>
          
          <div class="customer-info">
            <p><strong>Customer:</strong> ${customer.name}</p>
            <p><strong>Serial Number:</strong> ${customer.serialNumber}</p>
            <p><strong>Mobile:</strong> ${customer.mobile}</p>
            <p><strong>Statement Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <table class="transactions">
            <thead>
              <tr>
                <th>Date</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Advance Paid</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              ${transactions
                .map(
                  (transaction) => `
                <tr>
                  <td>${new Date(transaction.createdAt).toLocaleDateString()}</td>
                  <td>${transaction.items.map((item) => `${item.name} (${item.quantity})`).join(", ")}</td>
                  <td>₹${transaction.totalAmount}</td>
                  <td>₹${transaction.advanceAmount}</td>
                  <td>₹${transaction.remainingAmount}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="total">
                <td colspan="2"><strong>Total Outstanding</strong></td>
                <td><strong>₹${transactions.reduce((sum, t) => sum + t.totalAmount, 0)}</strong></td>
                <td><strong>₹${transactions.reduce((sum, t) => sum + t.advanceAmount, 0)}</strong></td>
                <td><strong>₹${transactions.reduce((sum, t) => sum + t.remainingAmount, 0)}</strong></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `

    // For now, return HTML content (in production, you'd use a PDF library like puppeteer)
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="statement-${customer.serialNumber}.html"`,
      },
    })
  } catch (error) {
    console.error("Statement generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
