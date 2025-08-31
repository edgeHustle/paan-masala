"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { ArrowLeft, Edit, Phone, MapPin, Calendar, Receipt, TrendingUp } from "lucide-react"
import Link from "next/link"

interface Customer {
  _id: string
  serialNumber: number
  name: string
  mobile: string
  address?: string
  createdAt: string
}

interface CustomerStats {
  totalTransactions: number
  totalAmount: number
  lastTransactionDate?: string
}

export default function CustomerDetailPage() {
  const params = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [stats, setStats] = useState<CustomerStats>({
    totalTransactions: 0,
    totalAmount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchCustomer()
      fetchCustomerStats()
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
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomerStats = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching customer stats:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
        <Link href="/customers">
          <Button>Back to Customers</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">#{customer.serialNumber}</Badge>
              <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            </div>
            <p className="text-muted-foreground">Customer Details</p>
          </div>
        </div>
        <Link href={`/customers/${customer._id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={`/transactions/new?customer=${customer._id}`}>
              <Button className="w-full" variant="default">
                <Receipt className="mr-2 h-4 w-4" />
                New Transaction
              </Button>
            </Link>
            <Link href={`/transactions?customer=${customer._id}`}>
              <Button className="w-full bg-transparent" variant="outline">
                View All Transactions
              </Button>
            </Link>
            <Link href={`/reports?customerId=${customer._id}`}>
              <Button className="w-full bg-transparent" variant="outline">
                Report
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info */}
      <div className="grid gap-6 md:grid-cols-2">

        <Card>
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="font-medium text-2xl">{stats.totalTransactions}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-medium text-2xl">₹{stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            {stats.lastTransactionDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Transaction</p>
                  <p className="font-medium">{new Date(stats.lastTransactionDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Mobile Number</p>
                <p className="font-medium">{customer.mobile}</p>
              </div>
            </div>

            {customer.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{customer.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Customer Since</p>
                <p className="font-medium">{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login Credentials */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Customer Login Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">The customer can login to view their transactions using:</p>
            <div className="bg-background p-4 rounded-lg border">
              <p>
                <strong>Serial Number:</strong> {customer.serialNumber}
              </p>
              <p>
                <strong>Mobile Number:</strong> {customer.mobile}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
