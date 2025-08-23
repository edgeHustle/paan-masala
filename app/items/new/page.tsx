"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import PrivateLayout from "@/components/layouts/private-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, Package } from "lucide-react"
import Link from "next/link"

const itemSchema = yup.object({
  name: yup.string().required("Item name is required").min(2, "Name must be at least 2 characters"),
  price: yup.number().required("Price is required").positive("Price must be positive"),
  category: yup.string().required("Category is required"),
  description: yup.string().optional(),
  isActive: yup.boolean().default(true),
})

type ItemForm = yup.InferType<typeof itemSchema>

export default function NewItemPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ItemForm>({
    resolver: yupResolver(itemSchema),
    defaultValues: {
      isActive: true,
    },
  })

  const isActive = watch("isActive")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: ItemForm) => {
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("price", data.price.toString())
      formData.append("category", data.category)
      formData.append("description", data.description || "")
      formData.append("isActive", data.isActive.toString())

      if (imageFile) {
        formData.append("image", imageFile)
      }

      const response = await fetch("/api/items", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create item")
      }

      router.push("/items")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create item")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PrivateLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/items">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Item</h1>
            <p className="text-muted-foreground">Add a new product to your inventory</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Item Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Image</label>
                <div className="flex flex-col gap-4">
                  {imagePreview && (
                    <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Item Name *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter item name"
                    {...register("name")}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">
                    Price (₹) *
                  </label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("price", { valueAsNumber: true })}
                    className={errors.price ? "border-destructive" : ""}
                  />
                  {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Category *
                </label>
                <Input
                  id="category"
                  type="text"
                  placeholder="e.g., Pan Masala, Supari, Zarda"
                  {...register("category")}
                  className={errors.category ? "border-destructive" : ""}
                />
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </label>
                <Textarea id="description" placeholder="Enter item description" rows={3} {...register("description")} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={(checked) => setValue("isActive", checked)} />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active (available for transactions)
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <Link href="/items" className="flex-1">
                  <Button type="button" variant="outline" className="w-full bg-transparent">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Item
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Common Categories */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Common Categories</h3>
            <div className="flex flex-wrap gap-2">
              {["Pan Masala", "Supari", "Zarda", "Tobacco", "Betel Nut", "Spices"].map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("category", category)}
                  className="text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PrivateLayout>
  )
}
