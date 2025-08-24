"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Phone,
  MapPin,
  Calendar,
  IndianRupee,
  Download,
  TrendingUp,
  Clock,
  LogOut,
} from "lucide-react"

interface Customer {
  _id: string
  serialNumber: number
  name: string
  mobile: string
  address: string
  createdAt: string
}

interface Transaction {
  _id: string
  items: Array<{
    name: string
    quantity: number
    price: number
    total: number
  }>
  totalAmount: number
  advanceAmount: number
  remainingAmount: number
  createdAt: string
}

interface CustomerStats {
  totalTransactions: number
  totalAmount: number
  totalAdvance: number
  outstandingAmount: number
}

export default function CustomerPortal() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchCustomerData()
  }, [])

  const fetchCustomerData = async () => {
    try {
      const response = await fetch("/api/customer-portal/data")
      const data = await response.json()

      if (response.ok) {
        setCustomer(data.customer)
        setTransactions(data.transactions)
        setStats(data.stats)
      } else {
        setError(data.error || "Failed to load data")
        if (response.status === 401) {
          router.push("/customer-login")
        }
      }
    } catch (error) {
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadStatement = async () => {
    try {
      const response = await fetch("/api/customer-portal/statement")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `statement-${customer?.serialNumber}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/customer-login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Welcome, {customer?.name}</h1>
                <p className="text-sm text-gray-600">Serial #: {customer?.serialNumber}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Mobile:</span>
                <span className="font-medium">{customer?.mobile}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Member Since:</span>
                <span className="font-medium">{new Date(customer?.createdAt || "").toLocaleDateString()}</span>
              </div>
            </div>
            {customer?.address && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <span className="text-sm text-gray-600">Address:</span>
                <span className="font-medium">{customer.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Total Transactions</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTransactions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <IndianRupee className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Total Amount</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.totalAmount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <IndianRupee className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Total Paid</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.totalAdvance}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-600">Outstanding</span>
                </div>
                <p className="text-2xl font-bold text-red-600 mt-1">₹{stats.outstandingAmount}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Download or share your account statement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleDownloadStatement} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Statement
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest purchase history</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No transactions found</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">{transaction.items.length} item(s)</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{transaction.totalAmount}</p>
                        {transaction.remainingAmount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            ₹{transaction.remainingAmount} pending
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="space-y-2">
                      {transaction.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.name} × {item.quantity.toString()}
                          </span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {transaction.advanceAmount > 0 && (
                      <div className="mt-3 pt-2 border-t">
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Advance Paid</span>
                          <span>₹{transaction.advanceAmount}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
