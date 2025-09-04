"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/app/components/ui/badge"
import type { Transaction } from "../Transactions"
import { Separator } from "@radix-ui/react-separator"
import { Button } from "@/app/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/app/components/ui/card"

export default function TransactionsPage() {
  const params = useParams();
  const [transaction, setTransaction] = useState<Transaction>({} as Transaction)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id }),
      })
      if (response.ok) {
        const data = await response.json()
        setTransaction(data.transaction)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Transaction details</h1>
      </div>
      {/* Transactions List */}
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Card className="gap-2">
                <CardHeader>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{transaction.customerSerialNumber}
                      </Badge>
                      <h3 className="font-semibold">{transaction.customerName}</h3>
                    </div>
                    <Badge>
                      Total: ₹{transaction.totalAmount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">

                    {transaction.advancePayment && transaction.advancePayment > 0 ? (
                      <p className="text-sm font-semibold">
                        <span className="text-primary">Paid: ₹{transaction.advancePayment}</span>
                        <br />
                        <span className="text-red-800">Remaining: ₹{transaction.remainingAmount}</span>
                      </p>
                    ) : ""}
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-in", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(transaction.createdAt))}
                    </p>
                  </div>
                  <Separator className="my-3 border border-solid border-t-1" />

                  <div className="space-y-2 flex flex-col gap-1">
                    <p className="text-md text-muted-foreground">
                      Total items: <span className="font-semibold">{transaction.items.length}</span>
                      {/* <span>₹{transaction.totalAmount}</span> */}
                    </p>
                    {transaction.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.name}-₹{item.price} × {item.quantity.toString()}
                        </span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
