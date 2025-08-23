"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import PrivateLayout from "@/components/layouts/private-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, User, Save } from "lucide-react"
import Link from "next/link"

const customerSchema = yup.object({
  name: yup.string().required("Customer name is required").min(2, "Name must be at least 2 characters"),
  mobile: yup
    .string()
    .required("Mobile number is required")
    .matches(/^[0-9]{10}$/, "Mobile number must be 10 digits"),
  address: yup.string().optional(),
})

type CustomerForm = yup.InferType<typeof customerSchema>

interface Customer {
  _id: string
  serialNumber: number
  name: string
  mobile: string
  address?: string
  createdAt: string
}

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: yupResolver(customerSchema),
  })

  useEffect(() => {
    if (params.id) {
      fetchCustomer()
    }
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data)

        // Populate form with existing data
        setValue("name", data.name)
        setValue("mobile", data.mobile)
        setValue("address", data.address || "")
      } else {
        setError("Customer not found")
      }
    } catch (error) {
      setError("Error loading customer data")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: CustomerForm) => {
    setIsSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/customers/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update customer")
      }

      router.push(`/customers/${params.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update customer")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <PrivateLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PrivateLayout>
    )
  }

  if (!customer) {
    return (
      <PrivateLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
          <Link href="/customers">
            <Button>Back to Customers</Button>
          </Link>
        </div>
      </PrivateLayout>
    )
  }

  return (
    <PrivateLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/customers/${customer._id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">#{customer.serialNumber}</Badge>
              <h1 className="text-2xl font-bold text-foreground">Edit Customer</h1>
            </div>
            <p className="text-muted-foreground">Update customer information</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Customer Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter customer's full name"
                  {...register("name")}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="mobile" className="text-sm font-medium">
                  Mobile Number *
                </label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  {...register("mobile")}
                  className={errors.mobile ? "border-destructive" : ""}
                />
                {errors.mobile && <p className="text-sm text-destructive">{errors.mobile.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address (Optional)
                </label>
                <Textarea id="address" placeholder="Enter customer's address" rows={3} {...register("address")} />
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>

              <div className="flex gap-4 pt-4">
                <Link href={`/customers/${customer._id}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Serial Number: #{customer.serialNumber}</h3>
            <p className="text-sm text-muted-foreground">
              The serial number cannot be changed as it's used for customer identification and login credentials.
            </p>
          </CardContent>
        </Card>
      </div>
    </PrivateLayout>
  )
}
