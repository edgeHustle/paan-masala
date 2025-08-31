"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Search, Plus, Phone, MapPin, User, Edit, Eye, FileText } from "lucide-react"
import Link from "next/link"

interface Customer {
  _id: string
  serialNumber: number
  name: string
  mobile: string
  address?: string
  createdAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    // Filter customers based on search term
    if (!searchTerm) {
      setFilteredCustomers(customers)
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.mobile.includes(searchTerm) ||
          customer.serialNumber.toString().includes(searchTerm),
      )
      setFilteredCustomers(filtered)
    }
  }, [customers, searchTerm])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setIsLoading(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Total: {customers.length}</p>
        </div>
        <Link href="/customers/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, mobile, or serial number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer List */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">{searchTerm ? "No customers found" : "No customers yet"}</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Start by adding your first customer"}
              </p>
              {!searchTerm && (
                <Link href="/customers/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Customer
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 max-h-[72vh] overflow-auto">
            {filteredCustomers.map((customer) => (
              <Card key={customer._id} className="hover:shadow-md transition-shadow py-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          #{customer.serialNumber}
                        </Badge>
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{customer.mobile}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/reports?customerId=${customer._id}`}>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/customers/${customer._id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/customers/${customer._id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
