"use client"

import { useEffect, useState } from "react"
import PrivateLayout from "@/components/layouts/private-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, Receipt, TrendingUp, Plus } from "lucide-react"
import Link from "next/link"
import type { Transaction } from "../transactions/page"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  totalCustomers: number
  totalItems: number
  todayTransactions: number
  monthlyRevenue: number,
  recentTransactions: Transaction[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalItems: 0,
    todayTransactions: 0,
    monthlyRevenue: 0,
    recentTransactions: []
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    // Fetch dashboard stats
    fetchDashboardStats();
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  const quickActions = [
    {
      title: "New Transaction",
      description: "Record a new customer transaction",
      href: "/transactions/new",
      icon: Plus,
      color: "bg-primary text-primary-foreground",
    },
    {
      title: "Add Customer",
      description: "Register a new customer",
      href: "/customers/new",
      icon: Users,
      color: "bg-secondary text-secondary-foreground",
    },
    {
      title: "Manage Items",
      description: "Add or update inventory items",
      href: "/items",
      icon: Package,
      color: "bg-accent text-accent-foreground",
    },
  ]

  return (
    <PrivateLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your business today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Active customers in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Available</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">Products in inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayTransactions}</div>
              <p className="text-xs text-muted-foreground">Transactions recorded today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Revenue this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 h-full items-center">
                    <div className="flex items-center space-x-4 h-full">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length <= 0 ?
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent transactions to display</p>
                <p className="text-sm">Start recording transactions to see activity here</p>
              </div>
              :
              <div className="space-y-4">
                {stats.recentTransactions.map((transaction) => (
                  <Card key={transaction._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              #{transaction.customerSerialNumber}
                            </Badge>
                            <h3 className="font-semibold">{transaction.customerName}</h3>
                          </div>

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

                          <div className="flex flex-wrap gap-1">
                            {transaction.items.slice(0, 3).map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item.name} x{item.quantity}
                                {item.isCustom && " (Custom)"}
                              </Badge>
                            ))}
                            {transaction.items.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{transaction.items.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/transactions/${transaction._id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </PrivateLayout>
  )
}
