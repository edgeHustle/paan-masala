"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import ItemSelector from "@/app/components/item-selector"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { ArrowLeft, Loader2, User, Receipt, Plus, X } from "lucide-react"
import Link from "next/link"

const transactionSchema = yup.object({
  customerSerialNumber: yup.number().required("Customer serial number is required").positive("Invalid serial number"),
  advancePayment: yup.number().min(0, "Advance payment cannot be negative").optional(),
})

type TransactionForm = yup.InferType<typeof transactionSchema>

interface Customer {
  _id: string
  serialNumber: number
  name: string
  mobile: string
  address?: string
}

interface SelectedItem {
  _id: string
  name: string
  price: number
  quantity: number
  category: string
  isCustom?: boolean
}

interface CustomItem {
  name: string
  price: number
  quantity: number
}

export default function NewTransactionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [customItems, setCustomItems] = useState<CustomItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState("")
  const [newCustomItem, setNewCustomItem] = useState({ name: "", price: 0, quantity: 1 })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: yupResolver(transactionSchema),
  })

  const customerSerialNumber = watch("customerSerialNumber")
  const advancePayment = watch("advancePayment") || 0

  useEffect(() => {
    // Pre-fill customer if provided via URL params
    const customerId = searchParams.get("customer")
    if (customerId) {
      fetchCustomerById(customerId)
    }
  }, [searchParams])

  useEffect(() => {
    // Auto-search customer when serial number is entered
    if (customerSerialNumber && customerSerialNumber > 0) {
      const timeoutId = setTimeout(() => {
        searchCustomer(customerSerialNumber)
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      setCustomer(null)
    }
  }, [customerSerialNumber])

  const fetchCustomerById = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data)
        setValue("customerSerialNumber", data.serialNumber)
      }
    } catch (error) {
      console.error("Error fetching customer:", error)
    }
  }

  const searchCustomer = async (serialNumber: number) => {
    setIsSearching(true)
    setError("")

    try {
      const response = await fetch(`/api/customers/search?serialNumber=${serialNumber}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data)
      } else {
        setCustomer(null)
        if (response.status === 404) {
          setError("Customer not found. Please check the serial number.")
        }
      }
    } catch (error) {
      setError("Error searching for customer")
      setCustomer(null)
    } finally {
      setIsSearching(false)
    }
  }

  const addCustomItem = () => {
    if (!newCustomItem.name || newCustomItem.price <= 0) {
      setError("Please enter valid custom item details")
      return
    }

    setCustomItems([...customItems, { ...newCustomItem }])
    setNewCustomItem({ name: "", price: 0, quantity: 1 })
    setError("")
  }

  const removeCustomItem = (index: number) => {
    setCustomItems(customItems.filter((_, i) => i !== index))
  }

  const updateCustomItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeCustomItem(index)
      return
    }

    const updated = [...customItems]
    updated[index].quantity = quantity
    setCustomItems(updated)
  }

  const calculateTotal = () => {
    const itemsTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const customTotal = customItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return itemsTotal + customTotal
  }

  const onSubmit = async (data: TransactionForm) => {
    if (!customer) {
      setError("Please select a customer first")
      return
    }

    if (selectedItems.length === 0 && customItems.length === 0) {
      setError("Please select at least one item")
      return
    }

    const totalAmount = calculateTotal()
    if (advancePayment > totalAmount) {
      setError("Advance payment cannot be more than total amount")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const transactionData = {
        customerId: customer._id,
        items: [
          ...selectedItems.map((item) => ({
            itemId: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            isCustom: false,
          })),
          ...customItems.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            isCustom: true,
          })),
        ],
        totalAmount,
        advancePayment: advancePayment || 0,
        remainingAmount: totalAmount - (advancePayment || 0),
      }

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create transaction")
      }

      router.push("/transactions")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create transaction")
    } finally {
      setIsLoading(false)
    }
  }

  const totalAmount = calculateTotal()
  const remainingAmount = totalAmount - advancePayment

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Transaction</h1>
          <p className="text-muted-foreground">Record a customer transaction</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="customerSerialNumber" className="text-sm font-medium">
                Customer Serial Number *
              </label>
              <div className="relative">
                <Input
                  id="customerSerialNumber"
                  type="number"
                  placeholder="Enter customer serial number"
                  {...register("customerSerialNumber", { valueAsNumber: true })}
                  className={errors.customerSerialNumber ? "border-destructive" : ""}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
              {errors.customerSerialNumber && (
                <p className="text-sm text-destructive">{errors.customerSerialNumber.message}</p>
              )}
            </div>

            {customer && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">#{customer.serialNumber}</Badge>
                  <h3 className="font-semibold">{customer.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">Mobile: {customer.mobile}</p>
                {customer.address && <p className="text-sm text-muted-foreground">Address: {customer.address}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Item Selection - Only show if customer is selected */}
        {customer && (
          <>
            {/* Regular Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Select Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ItemSelector onSelectionChange={setSelectedItems} selectedItems={selectedItems} />
              </CardContent>
            </Card>

            {/* Custom Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Custom Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Custom Item */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Item name"
                      value={newCustomItem.name}
                      onChange={(e) => setNewCustomItem({ ...newCustomItem, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={newCustomItem.price || ""}
                      onChange={(e) =>
                        setNewCustomItem({ ...newCustomItem, price: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={newCustomItem.quantity}
                      onChange={(e) =>
                        setNewCustomItem({ ...newCustomItem, quantity: Number.parseInt(e.target.value) || 1 })
                      }
                      className="flex-1"
                    />
                    <Button type="button" onClick={addCustomItem} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Custom Items List */}
                {customItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Custom Items Added:</h4>
                    {customItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateCustomItemQuantity(index, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateCustomItemQuantity(index, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            +
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCustomItem(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Details */}
            {(selectedItems.length > 0 || customItems.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="advancePayment" className="text-sm font-medium">
                      Advance Payment (Optional)
                    </label>
                    <Input
                      id="advancePayment"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register("advancePayment", { valueAsNumber: true })}
                      className={errors.advancePayment ? "border-destructive" : ""}
                    />
                    {errors.advancePayment && (
                      <p className="text-sm text-destructive">{errors.advancePayment.message}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    {advancePayment > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Advance Payment:</span>
                          <span>₹{advancePayment.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Remaining Amount:</span>
                          <span>₹{remainingAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            {(selectedItems.length > 0 || customItems.length > 0) && (
              <div className="flex gap-4">
                <Link href="/transactions" className="flex-1">
                  <Button type="button" variant="outline" className="w-full bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Transaction
                </Button>
              </div>
            )}
          </>
        )}
      </form>
    </div>
  )
}
