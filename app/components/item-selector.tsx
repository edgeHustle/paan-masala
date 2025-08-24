"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Badge } from "@/app/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Search, Package, Plus, Minus, X } from "lucide-react"

interface Item {
  _id: string
  name: string
  price: number
  category: string
  image?: string
  description?: string
  isActive: boolean
}

interface SelectedItem extends Item {
  quantity: number
}

interface ItemSelectorProps {
  onSelectionChange: (items: SelectedItem[]) => void
  selectedItems?: SelectedItem[]
}

export default function ItemSelector({ onSelectionChange, selectedItems = [] }: ItemSelectorProps) {
  const [items, setItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [selection, setSelection] = useState<SelectedItem[]>(selectedItems)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    // Filter items based on search term and category
    let filtered = items.filter((item) => item.isActive)

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    setFilteredItems(filtered)
  }, [items, searchTerm, selectedCategory])

  useEffect(() => {
    onSelectionChange(selection)
  }, [selection, onSelectionChange])

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items")
      if (response.ok) {
        const data = await response.json()
        setItems(data.filter((item: Item) => item.isActive))
      }
    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = (item: Item) => {
    const existingIndex = selection.findIndex((selected) => selected._id === item._id)

    if (existingIndex >= 0) {
      // Increase quantity
      const newSelection = [...selection]
      newSelection[existingIndex].quantity += 1
      setSelection(newSelection)
    } else {
      // Add new item
      setSelection([...selection, { ...item, quantity: 1 }])
    }
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    const newSelection = selection.map((item) => (item._id === itemId ? { ...item, quantity } : item))

    setSelection(newSelection)
  }

  const removeItem = (itemId: string) => {
    setSelection(selection.filter((item) => item._id !== itemId))
  }

  const getItemQuantity = (itemId: string) => {
    const item = selection.find((selected) => selected._id === itemId)
    return item ? item.quantity : 0
  }

  const categories = Array.from(new Set(items.map((item) => item.category)))
  const totalAmount = selection.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selected Items Summary */}
      {selection.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Selected Items ({selection.length})</h3>
              <p className="text-lg font-bold text-primary">₹{totalAmount.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              {selection.map((item) => (
                <div key={item._id} className="flex items-center justify-between bg-background p-2 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item._id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {filteredItems.map((item) => {
          const quantity = getItemQuantity(item._id)
          return (
            <Card
              key={item._id}
              className={`cursor-pointer transition-all hover:shadow-md ${quantity > 0 ? "ring-2 ring-primary bg-primary/5" : ""
                }`}
              onClick={() => addItem(item)}
            >
              <CardContent className="p-3">
                <div className="space-y-2">
                  {/* Item Image */}
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                    {item.image ? (
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {quantity > 0 && (
                      <Badge className="absolute top-1 right-1 bg-primary text-primary-foreground">{quantity}</Badge>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                    <p className="text-lg font-bold text-primary">₹{item.price}</p>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms or category filter</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
