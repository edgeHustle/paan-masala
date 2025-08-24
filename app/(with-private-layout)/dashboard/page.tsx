"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Users, Package, Receipt, TrendingUp, Plus, PlusIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { Transaction } from "../transactions/page"

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
  const router = useRouter();

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

  const cards = [
    {
      title: "Total Customers",
      icon: Users,
      value: stats.totalCustomers,
      description: "Active customers in system",
    },
    {
      title: "Items Available",
      icon: Package,
      value: stats.totalItems,
      description: "Products in inventory",
    },
    {
      title: "Today's Transactions",
      icon: Receipt,
      value: stats.todayTransactions,
      description: "Transactions recorded today",
    },
    {
      title: "Monthly Revenue",
      icon: TrendingUp,
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      description: "Revenue this month",
    },
  ];

  return (
    <div className="space-y-6 ">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-primary text-white p-2 rounded-full shadow-md hover:bg-primary/90 transition">
              <PlusIcon className="size-5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-64">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <DropdownMenuItem
                  key={index}
                  onClick={() => router.push(action.href)}
                  className="flex gap-2 items-start"
                >
                  <div className={`p-1.5 rounded-md ${action.color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {[...cards].map((card, index) => (
          <Card key={index} className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-grow">
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
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
  )
}
