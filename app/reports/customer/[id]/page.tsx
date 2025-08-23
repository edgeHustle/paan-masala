"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import PrivateLayout from "@/components/layouts/private-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, Download, Send, CalendarIcon, Loader2 } from "lucide-react"
import { format, subMonths } from "date-fns"
import Link from "next/link"

interface Customer {
  _id: string
  serialNumber: number
  name: string
  mobile: string
  address?: string
}

export default function CustomerReportPage() {
  const params = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchCustomer()
    }
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data)
      }
    } catch (error) {
      console.error("Error fetching customer:", error)
    }
  }

  const downloadPDF = async () => {
    if (!customer) return

    setIsGeneratingPDF(true)

    try {
      const queryParams = new URLSearchParams({
        customerId: customer._id,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      })

      const response = await fetch(`/api/reports/pdf?${queryParams}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `statement-${customer.serialNumber}-${format(dateRange.from, "yyyy-MM-dd")}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const sendWhatsApp = async () => {
    if (!customer) return

    setIsSendingWhatsApp(true)

    try {
      const response = await fetch("/api/reports/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer._id,
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        }),
      })

      if (response.ok) {
        alert("Statement sent to customer's WhatsApp successfully!")
      }
    } catch (error) {
      console.error("Error sending WhatsApp:", error)
    } finally {
      setIsSendingWhatsApp(false)
    }
  }

  if (!customer) {
    return (
      <PrivateLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PrivateLayout>
    )
  }

  return (
    <PrivateLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/customers/${customer._id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">#{customer.serialNumber}</Badge>
              <h1 className="text-2xl font-bold text-foreground">Generate Report</h1>
            </div>
            <p className="text-muted-foreground">Generate statement for {customer.name}</p>
          </div>
        </div>

        {/* Date Range Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="flex gap-4 pt-4">
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
          </CardContent>
        </Card>
      </div>
    </PrivateLayout>
  )
}
