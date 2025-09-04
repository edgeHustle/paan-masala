"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/app/components/ui/drawer"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Search, Plus, Receipt, Eye, Loader2, Minus, ChevronUp, UserCheck, Clock, TrendingUp } from "lucide-react"
import * as yup from "yup"
import Image from "next/image"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from "@/app/components/ui/command"

const schema = yup.object({
  customerSerialNumber: yup.number().required("Required").positive("Invalid"),
  advancePayment: yup.number().min(0).default(0).optional(),
})

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
  const router = useRouter()
  const searchParams = useSearchParams()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [items, setItems] = useState([])
  const [allItems, setAllItems] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [customName, setCustomName] = useState("")
  const [customPrice, setCustomPrice] = useState(0)
  const [customQty, setCustomQty] = useState(1)
  const [customerOptions, setCustomerOptions] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  const advancePayment = watch("advancePayment") || 0
  const totalAmount = items.reduce((sum, i: any) => sum + i.price * i.quantity, 0) || 0;
  const remainingAmount = totalAmount - advancePayment

  useEffect(() => {
    const id = searchParams.get("customer")
    if (id) fetchCustomerById(id)
    fetchAllItems()
  }, [])

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

  const fetchCustomerById = async (id: any) => {
    const res = await fetch(`/api/customers/${id}`)
    if (res.ok) {
      const data = await res.json()
      setCustomer(data)
      setValue("customerSerialNumber", data.serialNumber)
    }
  }

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

  const searchCustomers = async (query: string) => {
    if (!query) {
      setCustomerOptions([])
      return
    }
    setSearching(true)
    const res = await fetch(`/api/customers/search?query=${query}`)
    if (res.ok) {
      const data = await res.json()
      setCustomerOptions(data)
    } else {
      setCustomerOptions([])
    }
    setSearching(false)
  }

  const fetchAllItems = async () => {
    const res = await fetch("/api/items")
    if (res.ok) {
      const data = await res.json()
      setAllItems(data)
    }
  }

  const handleItemChange = (item: any, diff: any) => {
    const existing: any = items.find((i: any) => i._id === item._id)
    if (existing) {
      const updatedQty = existing.quantity + diff
      if (updatedQty <= 0) {
        setItems(items.filter((i: any) => i._id !== item._id))
      } else {
        setItems(items.map((i: any) => (i._id === item._id ? { ...i, quantity: updatedQty } : i)) as any)
      }
    } else if (diff > 0) {
      setItems([...items, { ...item, quantity: 1 }] as any)
    }
  }

  const onSubmit = async () => {
    if (!customer) return setError("Select a customer")
    if (!items.length && !advancePayment) return setError("Add items or advanced payment")

    setLoading(true)
    const payload = {
      customerId: customer._id,
      items: items.map((i: any) => ({
        itemId: i._id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        isCustom: false,
      })),
      totalAmount,
      advancePayment,
      remainingAmount,
    }
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) router.push("/transactions")
    else setError((await res.json()).error || "Failed")
    setLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-0">Manage customer orders and payments</p>
        </div>
        {/* <Link href="/transactions/new">
          <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
            <Plus className="h-4 w-4" /> New Transaction
          </Button>
        </Link> */}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Enhanced Find Customer Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 shadow-lg py-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Find Customer to Record Transaction</h2>
              <p className="text-sm text-muted-foreground">Search by serial number or customer name</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <div className="border-2 rounded-lg focus-within:border-primary/50 transition-colors bg-background/50 backdrop-blur-sm">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type serial number or customer name..."
                    onValueChange={(value) => {
                      setSearchValue(value)
                      searchCustomers(value)
                      setCustomer(null)
                    }}
                    className="pl-0 border-none focus:ring-0 h-12"
                  />
                  <CommandList className="max-h-60 overflow-y-auto">
                    {searching && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Searching customers...</span>
                      </div>
                    )}
                    {!searching && customerOptions.length === 0 && searchValue.length != 0 && (
                      <CommandEmpty className="py-6">
                        <div className="text-center">
                          <UserCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p className="text-sm text-muted-foreground">No customers found</p>
                        </div>
                      </CommandEmpty>
                    )}
                    {!searching && customerOptions.length > 0 && (
                      <CommandGroup heading="Search Results" className="p-2">
                        {customerOptions.map((cust) => (
                          <CommandItem
                            key={cust._id}
                            onSelect={() => {
                              setCustomer(cust)
                              setSearchValue("")
                              setCustomerOptions([])
                            }}
                            className="cursor-pointer hover:bg-primary/5 rounded-md p-3 transition-colors"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <Badge variant="outline" className="bg-primary/10 border-primary/20">
                                #{cust.serialNumber}
                              </Badge>
                              <div className="flex-1">
                                <p className="font-medium">{cust.name}</p>
                                <p className="text-xs text-muted-foreground">{cust.mobile}</p>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </div>
            </div>

            {errors.customerSerialNumber && (
              <p className="text-sm text-destructive font-medium flex items-center gap-2">
                <span className="w-1 h-1 bg-destructive rounded-full"></span>
                {errors.customerSerialNumber.message}
              </p>
            )}

            {customer && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full">
                    <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800">
                        #{customer.serialNumber}
                      </Badge>
                      <span className="font-semibold text-green-900 dark:text-green-100">{customer.name}</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">Mobile: {customer.mobile}</p>
                  </div>
                  <Badge className="bg-green-600 hover:bg-green-700 text-white">
                    Selected
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {customer && (
        <>
          {/* Custom Item Entry */}
          <Card className="border-dashed border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 py-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-md">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Add Custom Item</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-blue-800 dark:text-blue-200">Item Name</label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Kurkure"
                    className="border-blue-200 dark:border-blue-800 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-blue-800 dark:text-blue-200">Price (₹)</label>
                  <Input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="border-blue-200 dark:border-blue-800 focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button size="icon" variant="ghost" onClick={() => setCustomQty(q => Math.max(1, q - 1))} className="hover:bg-blue-100 dark:hover:bg-blue-900/40">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[20px] text-sm font-medium">{customQty}</span>
                  <Button size="icon" variant="ghost" onClick={() => setCustomQty(q => q + 1)} className="hover:bg-blue-100 dark:hover:bg-blue-900/40">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleItemChange(
                        {
                          _id: `custom-${Date.now()}`,
                          name: customName,
                          price: customPrice,
                          isCustom: true,
                        },
                        customQty
                      )
                      setCustomName("")
                      setCustomPrice(0)
                      setCustomQty(1)
                    }}
                    disabled={!customName || !customPrice}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items list */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Select Items</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-8">
              {allItems.map((product: any) => {
                const existing: any = items.find((it: any) => it._id === product._id)
                const qty = existing?.quantity || 0
                return (
                  <div key={product._id} className="border rounded-lg p-3 flex flex-col items-center text-center hover:shadow-md transition-all duration-200 bg-card">
                    <Image
                      src={product.image || "/placeholder.png"}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="rounded object-cover"
                    />
                    <h4 className="font-medium text-sm mt-2">{product.name}</h4>
                    <p className="text-sm font-semibold text-primary">₹{product.price}</p>

                    {qty === 0 ? (
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => handleItemChange(product, 1)}
                      >
                        Add
                      </Button>
                    ) : (
                      <div className="mt-2 flex items-center gap-1 bg-primary/5 rounded-lg p-1">
                        <Button size="icon" variant="ghost" onClick={() => handleItemChange(product, -1)} className="h-8 w-8">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[24px] text-sm font-medium bg-background rounded px-2 py-1">{qty}</span>
                        <Button size="icon" variant="ghost" onClick={() => handleItemChange(product, 1)} className="h-8 w-8">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom Floating Summary */}
      {customer && <Drawer>
        <DrawerTrigger asChild>
          <div className="fixed bottom-[70px] lg:bottom-0 left-0 right-0 z-10 p-4 bg-white dark:bg-background border-t-2 border-primary/20 flex justify-between items-center text-sm cursor-pointer shadow-lg backdrop-blur-sm bg-white/95 dark:bg-background/95">
            <span className="font-medium">{items.length} items</span>
            <span className="font-bold text-lg text-primary">₹{totalAmount.toFixed(2)}</span>
            <ChevronUp className="h-5 w-5 text-primary" />
          </div>
        </DrawerTrigger>
        <DrawerContent className="p-0 flex flex-col h-[90vh]">
          <DrawerTitle className="px-4 pt-2">Transaction Summary</DrawerTitle>

          {/* Scrollable Items List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {items.map((i: any) => (
              <div
                key={i._id}
                className="flex justify-between items-center text-sm border rounded-md px-3 py-2"
              >
                <div className="flex-1">
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{i.price} × {i.quantity} = ₹{i.price * i.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleItemChange(i, -1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[20px] text-sm">{i.quantity}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleItemChange(i, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Static Bottom Summary Bar */}
          <div className="border-t bg-background p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm font-medium">
              <div>Total: ₹{totalAmount.toFixed(2)}</div>
            </div>
            <div className="flex justify-between gap-2 w-full sm:w-auto">
              <div className="flex flex-col text-sm">
                <label className="font-medium">Advance Paid</label>
                <Input
                  type="number"
                  placeholder="₹ amount paid now"
                  {...register("advancePayment", { valueAsNumber: true })}
                  className="w-full sm:w-28"
                />
              </div>
              <div className="flex flex-col h-full justify-end">
                <Button onClick={onSubmit} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>}

      {/* Recent Transactions Section */}
      {!customer && (
        <div className="space-y-6">
          {/* Recent Transactions Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Clock className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Recent Transactions</h2>
              <p className="text-sm text-muted-foreground">View and manage your transaction history</p>
            </div>
          </div>

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
                    <CardContent className="p-2 flex flex-col gap-2 justify-center">
                      <Link
                        href={`/transactions/${transaction._id}`}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>

                      <div className="flex items-center gap-2">
                        <div className="text-xs">
                          #{transaction.customerSerialNumber}
                        </div>
                        <h3 className="font-medium text-base">{transaction.customerName}</h3>
                        <span className="text-sm text-muted-foreground">  ₹{transaction.totalAmount} {transaction.advancePayment ? `• paid: ₹${(transaction.advancePayment || 0)}` : ''} </span>
                      </div>

                      {/* <div className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </div> */}

                      {/* <p className="text-sm text-muted-foreground">
                        ₹{transaction.totalAmount.toFixed(2)} {transaction.advancePayment ? `• paid: ₹${(transaction.advancePayment || 0).toFixed(2)}` : ''}  */}
                        {/* • Remaining: ₹{transaction.remainingAmount.toFixed(2) */}
                        {/* } */}
                      {/* </p> */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}