"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Badge } from "@/app/components/ui/badge"
import { Calendar } from "@/app/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { FileText, Download, Send, CalendarIcon, TrendingUp, Users, Receipt, Package, Loader2 } from "lucide-react"
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns"

interface Customer {
  _id: string
  serialNumber: number
  name: string
  mobile: string
}

interface ReportData {
  totalTransactions: number
  totalAmount: number
  totalAdvance: number
  remainingAmount: number
  transactions: Array<{
    _id: string
    createdAt: string
    items: Array<{
      name: string
      price: number
      quantity: number
      isCustom: boolean
    }>
    totalAmount: number
    advancePayment: number
    remainingAmount: number
  }>
}

export default function ReportsPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const setQuickDateRange = (type: string) => {
    const now = new Date()
    let from: Date

    switch (type) {
      case "today":
        from = startOfDay(now)
        break
      case "yesterday":
        from = startOfDay(subDays(now, 1))
        setDateRange({ from, to: endOfDay(subDays(now, 1)) })
        return
      case "week":
        from = subWeeks(now, 1)
        break
      case "month":
        from = subMonths(now, 1)
        break
      case "3months":
        from = subMonths(now, 3)
        break
      default:
        return
    }

    setDateRange({ from, to: now })
  }

  const generateReport = async () => {
    if (!selectedCustomer) {
      setError("Please select a customer")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const params = new URLSearchParams({
        customerId: selectedCustomer,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      })

      const response = await fetch(`/api/reports/customer?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      } else {
        const error = await response.json()
        setError(error.error || "Failed to generate report")
      }
    } catch (error) {
      setError("Error generating report")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!selectedCustomer || !reportData) return

    setIsGeneratingPDF(true)
    setError("")

    try {
      const params = new URLSearchParams({
        customerId: selectedCustomer,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      })

      const response = await fetch(`/api/reports/pdf?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `statement-${selectedCustomer}-${format(dateRange.from, "yyyy-MM-dd")}-${format(
          dateRange.to,
          "yyyy-MM-dd",
        )}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setSuccess("PDF downloaded successfully")
      } else {
        const error = await response.json()
        setError(error.error || "Failed to generate PDF")
      }
    } catch (error) {
      setError("Error downloading PDF")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const sendWhatsApp = async () => {
    if (!selectedCustomer || !reportData) return

    setIsSendingWhatsApp(true)
    setError("")

    try {
      const params = new URLSearchParams({
        customerId: selectedCustomer,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      })

      const response = await fetch(`/api/reports/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer,
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        }),
      })

      if (response.ok) {
        setSuccess("Statement sent to customer's WhatsApp successfully")
      } else {
        const error = await response.json()
        setError(error.error || "Failed to send WhatsApp message")
      }
    } catch (error) {
      setError("Error sending WhatsApp message")
    } finally {
      setIsSendingWhatsApp(false)
    }
  }

  const selectedCustomerData = customers.find((c) => c._id === selectedCustomer)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Statements</h1>
        <p className="text-muted-foreground">Generate customer statements and business reports</p>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Customer Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Customer *</label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer._id} value={customer._id}>
                    #{customer.serialNumber} - {customer.name} ({customer.mobile})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium">Date Range</label>

            {/* Quick Date Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDateRange("today")}>
                Today
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDateRange("yesterday")}>
                Yesterday
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDateRange("week")}>
                Last Week
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDateRange("month")}>
                Last Month
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDateRange("3months")}>
                Last 3 Months
              </Button>
            </div>

            {/* Custom Date Range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.from, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.to, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Generate Report Button */}
          <Button onClick={generateReport} disabled={isLoading || !selectedCustomer} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && selectedCustomerData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Statement for {selectedCustomerData.name}
              </div>
              <Badge variant="secondary">#{selectedCustomerData.serialNumber}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold">{reportData.totalTransactions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">₹{reportData.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Advance Paid</p>
                      <p className="text-2xl font-bold">₹{reportData.totalAdvance.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="text-2xl font-bold">₹{reportData.remainingAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={downloadPDF} disabled={isGeneratingPDF} className="flex-1">
                {isGeneratingPDF && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={sendWhatsApp} disabled={isSendingWhatsApp} variant="secondary" className="flex-1">
                {isSendingWhatsApp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Send WhatsApp
              </Button>
            </div>

            {/* Transaction Details */}
            {reportData.transactions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Transaction Details</h3>
                <div className="space-y-3">
                  {reportData.transactions.map((transaction) => (
                    <Card key={transaction._id} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">{format(new Date(transaction.createdAt), "PPP")}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(transaction.createdAt), "p")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₹{transaction.totalAmount.toFixed(2)}</p>
                            {transaction.advancePayment > 0 && (
                              <p className="text-sm text-green-600">
                                Advance: ₹{transaction.advancePayment.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          {transaction.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.name} x{item.quantity}
                                {item.isCustom && " (Custom)"}
                              </span>
                              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
