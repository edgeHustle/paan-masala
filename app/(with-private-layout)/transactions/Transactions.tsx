"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Search, Plus, Receipt, Eye } from "lucide-react"
import Link from "next/link"

export interface Transaction {
  _id: string
  customerId: string
  customerName: string
  customerSerialNumber: number
  items: Array<{
    itemId?: string
    name: string
    price: number
    quantity: number
    isCustom: boolean
  }>
  totalAmount: number
  advancePayment?: number
  remainingAmount: number
  createdAt: string
  createdBy: string
}

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    // Filter transactions based on search term and date
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.customerSerialNumber.toString().includes(searchTerm),
      )
    }

    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }

      filtered = filtered.filter((transaction) => new Date(transaction.createdAt) >= filterDate)
    }

    // If customer filter is provided via URL params
    const customerFilter = searchParams.get("customer")
    if (customerFilter) {
      filtered = filtered.filter((transaction) => transaction.customerId === customerFilter)
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, dateFilter, searchParams])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0)
  const totalAdvance = filteredTransactions.reduce((sum, transaction) => sum + (transaction.advancePayment || 0), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <Link href="/transactions/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> New
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-center justify-center py-1">
          <CardContent className="h-full w-full flex flex-col justify-center items-center p-4 text-center">
            <Receipt className="h-5 w-5 text-secondary mb-2" />
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center py-1">
          <CardContent className="h-full w-full flex flex-col justify-center items-center p-4 text-center">
            <Receipt className="h-5 w-5 text-accent mb-2" />
            <p className="text-sm text-muted-foreground">Advance Payments</p>
            <p className="text-2xl font-bold">₹{totalAdvance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="py-1">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search name or serial number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>


      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "No transactions found" : "No transactions yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Start by recording your first transaction"}
              </p>
              {!searchTerm && (
                <Link href="/transactions/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Record First Transaction
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <Card key={transaction._id} className="hover:shadow-md transition-shadow relative py-1">
                <CardContent className="p-4 flex flex-col gap-2 min-h-[110px] justify-center">
                  <Link
                    href={`/transactions/${transaction._id}`}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      #{transaction.customerSerialNumber}
                    </Badge>
                    <h3 className="font-medium text-base">{transaction.customerName}</h3>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    ₹{transaction.totalAmount.toFixed(2)} {transaction.advancePayment ? `• Advance: ₹${(transaction.advancePayment || 0).toFixed(2)}` : ''} • Remaining: ₹{transaction.remainingAmount.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
