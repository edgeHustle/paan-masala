import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || (user.role !== "admin" && user.role !== "user")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const items = await db.collection("items").find({}).sort({ name: 1 }).toArray()

    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get("name") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const isActive = formData.get("isActive") === "true"
    const imageFile = formData.get("image") as File | null

    if (!name || !price || !category) {
      return NextResponse.json({ error: "Name, price, and category are required" }, { status: 400 })
    }

    if (price <= 0) {
      return NextResponse.json({ error: "Price must be positive" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if item name already exists
    const existingItem = await db.collection("items").findOne({ name: name.trim() })
    if (existingItem) {
      return NextResponse.json({ error: "Item with this name already exists" }, { status: 400 })
    }

    // Handle image upload (for now, we'll use placeholder)
    let imageUrl = ""
    if (imageFile && imageFile.size > 0) {
      // In a real app, you'd upload to a storage service like Vercel Blob
      // For now, we'll use a placeholder
      imageUrl = `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(name)}`
    }

    // Create item
    const item = {
      name: name.trim(),
      price,
      category: category.trim(),
      description: description?.trim() || "",
      image: imageUrl,
      isActive,
      createdAt: new Date(),
    }

    const result = await db.collection("items").insertOne(item)

    return NextResponse.json(
      {
        _id: result.insertedId,
        ...item,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
