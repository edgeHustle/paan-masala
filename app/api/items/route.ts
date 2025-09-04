import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/app/api/utils/mongodb"
import { getUserFromRequest } from "@/app/api/utils/auth"
import { put } from "@vercel/blob"
export async function GET(request: NextRequest) {
  try {
    const user: any = getUserFromRequest(request)
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
    const user: any = getUserFromRequest(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get("name") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const description = formData.get("description") as string
    const isActive = formData.get("isActive") === "true"
    const imageFile = formData.get("image") as File | null

    if (!name || !price) {
      return NextResponse.json({ error: "Name and Price are required" }, { status: 400 })
    }

    if (price <= 0) {
      return NextResponse.json({ error: "Price must be positive" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if item name already exists
    const existingItem = await db.collection("items").findOne({ name: name.trim(), price: price })
    if (existingItem) {
      return NextResponse.json({ error: "Item with this name and price already exists" }, { status: 400 })
    }

    // Handle image upload
    let imageUrl = ""
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Append timestamp to filename
      const ext = imageFile.name.split(".").pop() || "png"
      const fileName = `${Date.now()}_${name.replace(/\s+/g, "_")}.${ext}`

      // Upload to Vercel Blob
      const { url } = await put(fileName, buffer, {
        access: "public",
        token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
      })

      imageUrl = url
    }

    // Create item
    const item = {
      name: name.trim(),
      price,
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
