import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { format } from "date-fns";
import puppeteer from "puppeteer";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!customerId || !from || !to) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const db = await getDatabase();

    const customer = await db.collection("customers").findOne({ _id: new ObjectId(customerId) });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

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
      .toArray();

    const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalAdvance = transactions.reduce((sum, t) => sum + (t.advancePayment || 0), 0);
    const remainingAmount = transactions.reduce((sum, t) => sum + t.remainingAmount, 0);

    const html = generatePDFHTML({
      customer,
      transactions,
      dateRange: { from: fromDate, to: toDate },
      totals: { totalAmount, totalAdvance, remainingAmount },
    });

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    const filename = `statement-${customer.serialNumber}-${format(fromDate, "yyyy-MM-dd")}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generatePDFHTML({
  customer,
  transactions,
  dateRange,
  totals,
}: {
  customer: any;
  transactions: any[];
  dateRange: { from: Date; to: Date };
  totals: { totalAmount: number; totalAdvance: number; remainingAmount: number };
}) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Customer Statement - ${customer.name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #059669;
            padding-bottom: 20px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 5px;
        }
        .statement-title {
            font-size: 18px;
            color: #666;
        }
        .customer-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .summary {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #059669;
        }
        .transactions {
            margin-top: 20px;
        }
        .transaction {
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 15px;
            padding: 15px;
        }
        .transaction-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
        }
        .transaction-date {
            font-weight: bold;
        }
        .transaction-amount {
            font-size: 16px;
            font-weight: bold;
            color: #059669;
        }
        .items-list {
            margin-top: 10px;
        }
        .item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dotted #ddd;
        }
        .item:last-child {
            border-bottom: none;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        .outstanding {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 8px;
            margin-top: 15px;
            text-align: center;
        }
        .outstanding-amount {
            font-size: 20px;
            font-weight: bold;
            color: #d63031;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Pan Masala Accounting</div>
        <div class="statement-title">Customer Statement</div>
    </div>

    <div class="customer-info">
        <div class="info-row">
            <strong>Customer Name:</strong>
            <span>${customer.name}</span>
        </div>
        <div class="info-row">
            <strong>Serial Number:</strong>
            <span>#${customer.serialNumber}</span>
        </div>
        <div class="info-row">
            <strong>Mobile:</strong>
            <span>${customer.mobile}</span>
        </div>
        ${customer.address
      ? `<div class="info-row">
            <strong>Address:</strong>
            <span>${customer.address}</span>
        </div>`
      : ""
    }
        <div class="info-row">
            <strong>Statement Period:</strong>
            <span>${format(dateRange.from, "dd/MM/yyyy")} to ${format(dateRange.to, "dd/MM/yyyy")}</span>
        </div>
        <div class="info-row">
            <strong>Generated On:</strong>
            <span>${format(new Date(), "dd/MM/yyyy HH:mm")}</span>
        </div>
    </div>

    <div class="summary">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-label">Total Transactions</div>
                <div class="summary-value">${transactions.length}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Amount</div>
                <div class="summary-value">₹${totals.totalAmount.toLocaleString()}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Advance Paid</div>
                <div class="summary-value">₹${totals.totalAdvance.toLocaleString()}</div>
            </div>
        </div>
    </div>

    ${totals.remainingAmount > 0
      ? `<div class="outstanding">
        <div>Outstanding Amount</div>
        <div class="outstanding-amount">₹${totals.remainingAmount.toLocaleString()}</div>
    </div>`
      : ""
    }

    <div class="transactions">
        <h3>Transaction Details</h3>
        ${transactions
      .map(
        (transaction) => `
            <div class="transaction">
                <div class="transaction-header">
                    <div class="transaction-date">${format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}</div>
                    <div class="transaction-amount">₹${transaction.totalAmount.toFixed(2)}</div>
                </div>
                ${transaction.advancePayment > 0
            ? `<div style="color: #059669; font-size: 14px; margin-bottom: 8px;">
                    Advance Payment: ₹${transaction.advancePayment.toFixed(2)} | 
                    Remaining: ₹${transaction.remainingAmount.toFixed(2)}
                </div>`
            : ""
          }
                <div class="items-list">
                    ${transaction.items
            .map(
              (item: any) => `
                        <div class="item">
                            <span>${item.name} x${item.quantity}${item.isCustom ? " (Custom)" : ""}</span>
                            <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `
            )
            .join("")}
                </div>
            </div>
        `
      )
      .join("")}
    </div>

    <div class="footer">
        <p>This is a computer-generated statement. For any queries, please contact us.</p>
        <p>Thank you for your business!</p>
    </div>
</body>
</html>
  `;
}
