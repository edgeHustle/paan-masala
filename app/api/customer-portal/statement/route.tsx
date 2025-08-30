import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/api/utils/mongodb"
import { verifyToken } from "@/app/api/utils/auth"
import puppeteer from "puppeteer"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded: any = verifyToken(token)
    if (!decoded || decoded.type !== "customer") {
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
      .find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .toArray()

    // Build the HTML for Puppeteer
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
            <h1>${process.env.BUSINESS_NAME}</h1>
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
                  <td>${transaction.items.map((item: any) => `${item.name} (${item.quantity})`).join(", ")}</td>
                  <td>₹${transaction.totalAmount}</td>
                  <td>₹${transaction.advancePayment}</td>
                  <td>₹${transaction.remainingAmount}</td>
                </tr>
              `,
        )
        .join("")}
              <tr class="total">
                <td colspan="2"><strong>Total Outstanding</strong></td>
                <td><strong>₹${transactions.reduce((sum, t) => sum + t.totalAmount, 0)}</strong></td>
                <td><strong>₹${transactions.reduce((sum, t) => sum + t.advancePayment, 0)}</strong></td>
                <td><strong>₹${transactions.reduce((sum, t) => sum + t.remainingAmount, 0)}</strong></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `
    // Use Puppeteer to generate PDF
    const browser = await puppeteer.launch({
      headless: "new" as any, // ✅ required for latest puppeteer
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })
    const pdfBuffer: any = await page.pdf({ format: "A4", printBackground: true })
    await browser.close()

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="statement-${customer.serialNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Statement generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
