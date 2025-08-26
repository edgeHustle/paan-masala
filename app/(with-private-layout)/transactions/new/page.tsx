"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"

import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/app/components/ui/drawer"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { ArrowLeft, Loader2, Plus, Minus, Eye, ChevronUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const schema = yup.object({
  customerSerialNumber: yup.number().required("Required").positive("Invalid"),
  advancePayment: yup.number().min(0).default(0).optional(),
})

export default function NewTransactionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [customer, setCustomer] = useState(null)
  const [items, setItems] = useState([])
  const [allItems, setAllItems] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customPrice, setCustomPrice] = useState(0)
  const [customQty, setCustomQty] = useState(1)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  const customerSerialNumber = watch("customerSerialNumber")
  const advancePayment = watch("advancePayment") || 0
  const totalAmount = items.reduce((sum, i: any) => sum + i.price * i.quantity, 0) || 0;
  const remainingAmount = totalAmount - advancePayment

  useEffect(() => {
    const id = searchParams.get("customer")
    if (id) fetchCustomerById(id)
    fetchAllItems()
  }, [])

  useEffect(() => {
    if (customerSerialNumber && customerSerialNumber > 0) {
      const timeout = setTimeout(() => searchCustomer(customerSerialNumber), 500)
      return () => clearTimeout(timeout)
    } else setCustomer(null)
  }, [customerSerialNumber])

  const fetchCustomerById = async (id) => {
    const res = await fetch(`/api/customers/${id}`)
    if (res.ok) {
      const data = await res.json()
      setCustomer(data)
      setValue("customerSerialNumber", data.serialNumber)
    }
  }

  const searchCustomer = async (serial: any) => {
    setSearching(true)
    const res = await fetch(`/api/customers/search?serialNumber=${serial}`)
    if (res.ok) setCustomer(await res.json())
    else {
      setCustomer(null)
      if (res.status === 404) setError("Customer not found")
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
      items: items.map((i) => ({
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

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">New Transaction</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium">Customer Serial Number *</label>
        <div className="relative">
          <Input
            type="number"
            placeholder="Enter serial number"
            {...register("customerSerialNumber", { valueAsNumber: true })}
            className={errors.customerSerialNumber ? "border-destructive" : ""}
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
        </div>
        {errors.customerSerialNumber && (
          <p className="text-sm text-destructive">{errors.customerSerialNumber.message}</p>
        )}

        {customer && (
          <div className="p-3 bg-muted border border-border rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">#{customer.serialNumber}</span>
              <span className="text-sm font-medium">{customer.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Mobile: {customer.mobile}</p>
          </div>
        )}
      </div>

      {customer && (
        <>
          {/* Custom Item Entry */}
          <div className="border rounded-md p-3 mb-4 space-y-2 bg-muted/50">
            <h4 className="font-semibold text-sm">Add Custom Item</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
              <div>
                <label className="text-xs">Item Name</label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Kurkure"
                />
              </div>
              <div>
                <label className="text-xs">Price (₹)</label>
                <Input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button size="icon" variant="ghost" onClick={() => setCustomQty(q => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[20px] text-sm">{customQty}</span>
                <Button size="icon" variant="ghost" onClick={() => setCustomQty(q => q + 1)}>
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
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Items list */}
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {allItems.map((product) => {
                const existing = items.find((it) => it._id === product._id)
                const qty = existing?.quantity || 0
                return (
                  <div key={product._id} className="border rounded-md p-2 flex flex-col items-center text-center">
                    <Image
                      src={product.image || "/placeholder.png"}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="rounded object-cover"
                    />
                    <h4 className="font-medium text-sm mt-1">{product.name}</h4>
                    <p className="text-xs text-muted-foreground">₹{product.price}</p>

                    {qty === 0 ? (
                      <Button
                        size="sm"
                        className="mt-1"
                        onClick={() => handleItemChange(product, 1)}
                      >
                        Add
                      </Button>
                    ) : (
                      <div className="mt-1 flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleItemChange(product, -1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[20px] text-sm">{qty}</span>
                        <Button size="icon" variant="ghost" onClick={() => handleItemChange(product, 1)}>
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
      <Drawer>
        <DrawerTrigger asChild>
          <div className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white dark:bg-background border-t flex justify-between items-center text-sm cursor-pointer">
            <span className="font-medium">{items.length} items</span>
            <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
            <ChevronUp className="h-5 w-5" />
          </div>
        </DrawerTrigger>
        <DrawerContent className="p-0 pt-4 flex flex-col h-[90vh]">
          <DrawerTitle className="px-4">Transaction Summary</DrawerTitle>

          {/* Scrollable Items List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {items.map((i: any) => (
              <div key={i._id} className="flex justify-between text-sm">
                <span>{i.name} × {i.quantity}</span>
                <span>₹{i.price * i.quantity}</span>
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
      </Drawer>
    </div>
  )
}
