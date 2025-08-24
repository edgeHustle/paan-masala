"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Search, Plus, Package, Edit, Trash2, Eye, EyeOff, MoreVertical } from "lucide-react"
import Link from "next/link"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface Item {
  _id: string
  name: string
  price: number
  category: string
  image?: string
  description?: string
  isActive: boolean
  createdAt: string
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [user, setUser] = useState<any>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    // Get user info
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchItems()
  }, [])

  useEffect(() => {
    // Filter items based on search term and category
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        // item.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // if (selectedCategory !== "all") {
    //   filtered = filtered.filter((item) => item.category === selectedCategory)
    // }

    setFilteredItems(filtered)
  }, [items, searchTerm, selectedCategory])

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items")
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleItemStatus = async (itemId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        fetchItems()
      }
    } catch (error) {
      console.error("Error updating item status:", error)
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchItems()
      }
    } catch (error) {
      console.error("Error deleting item:", error)
    }
  }

  const categories = Array.from(new Set(items.map((item) => item.category)))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Items Management</h1>
          <div className="flex gap-4">
            <p className="text-muted-foreground">Total: {items.length}</p>
            <p className="text-muted-foreground">Active: {items.filter((item) => item.isActive).length}</p>
          </div>
        </div>
        {user?.role === "admin" && (
          <Link href="/items/new">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>


      {/* Items Grid */}
      <div className="grid max-h-[70vh] overflow-auto grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item) => {
          const isMenuOpen = openMenuId === item._id;

          return (
            <div key={item._id} className="relative">
              <Card
                className={`hover:shadow-md transition-shadow relative ${!item.isActive ? "opacity-60" : ""} py-0`}
                onClick={() => {
                  if (user?.role === "admin") {
                    setOpenMenuId((prev) => (prev === item._id ? null : item._id));
                  }
                }}
              >
                <CardContent className="p-4 relative group">
                  {/* 3-dots trigger — always visible in corner */}
                  {user?.role === "admin" && (
                    <button
                      className="absolute top-1 right-0 p-1 rounded hover:bg-muted z-20"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent card click from firing
                        setOpenMenuId((prev) => (prev === item._id ? null : item._id));
                      }}
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}

                  {/* Dropdown menu */}
                  {isMenuOpen && (
                    <div
                      className="absolute top-6 right-2 min-w-[120px] bg-white border rounded-md shadow-lg p-1 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/items/${item._id}/edit`}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </Link>

                      <button
                        onClick={() => {
                          toggleItemStatus(item._id, item.isActive);
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                      >
                        {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => {
                          deleteItem(item._id);
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="space-y-3">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                        <p className="text-lg font-bold text-primary">₹{item.price}</p>
                      </div>
                      <Badge variant={item.isActive ? "default" : "secondary"} className="text-xs">
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

    </div>
  )
}
