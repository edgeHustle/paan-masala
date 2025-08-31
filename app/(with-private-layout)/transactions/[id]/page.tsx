"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/app/components/ui/badge"
import type { Transaction } from "../Transactions"
import { Separator } from "@radix-ui/react-separator"
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
            {/* Transactions List */}
            <div className="space-y-4">
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">
                                            #{transaction.customerSerialNumber}
                                        </Badge>
                                        <h3 className="font-semibold">{transaction.customerName}</h3>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            {transaction.items.length} item(s) • ₹{transaction.totalAmount.toFixed(2)}
                                        </p>
                                        {transaction.advancePayment && transaction.advancePayment > 0 && (
                                            <p className="text-sm text-green-600">
                                                Advance: ₹{transaction.advancePayment.toFixed(2)} • Remaining: ₹
                                                {transaction.remainingAmount.toFixed(2)}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(transaction.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <Separator className="my-3" />

                                    <div className="space-y-2 flex flex-col gap-1">
                                        {transaction.items.map((item, index) => (
                                            <div key={index} className="flex justify-between text-md">
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
