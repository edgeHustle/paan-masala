"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent } from "@/app/components/ui/card"
import { Home, Users, Package, Receipt, FileText, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"

interface PrivateLayoutProps {
  children: React.ReactNode
}

export default function PrivateLayout({ children }: PrivateLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const [active, setActive] = useState("Dashboard")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("userType")
    router.push("/login")
  }

  const navigation = [
    { id: "Dashboard", name: "Dashboard", href: "/dashboard", icon: Home },
    { id: "Customers", name: "Customers", href: "/customers", icon: Users },
    { id: "Transactions", name: "Transactions", href: "/transactions", icon: Receipt },
    { id: "Items", name: "Items", href: "/items", icon: Package },
    { id: "Reports", name: "Reports", href: "/reports", icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar – visible only on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:flex`}
      >
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-lg font-semibold text-primary">{process.env.BUSINESS_NAME}</h1>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 hidden lg:block">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left ${active === item.id ? "text-primary font-semibold" : ""}`}
                  onClick={() => {
                    setActive(item.name)
                    setSidebarOpen(false)
                  }}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t">
            {user && (
              <Card className="mb-3">
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </CardContent>
              </Card>
            )}
            <Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom nav – visible only on mobile/tablet */}
      <div className="fixed bottom-0 w-full h-[70px] bg-white px-3 shadow-[0px_-4px_6px_0px_rgba(0,0,0,0.05)] z-50 lg:hidden">
        <div className="flex h-full items-center justify-between gap-1 w-full max-w-[440px] mx-auto">
          {navigation.map((menu) => {
            const isActive = active === menu.id
            return (
              <Link href={menu.href} key={menu.id} className="flex-1 min-w-0">
                <button
                  onClick={() => setActive(menu.id)}
                  className={`w-full h-full flex flex-col items-center justify-center px-2 pt-3 pb-2 text-center transition-all duration-200
              ${isActive
                      ? "text-primary border-t-2 border-primary"
                      : "text-muted-foreground border-t-2 border-transparent hover:text-primary"}
            `}
                >
                  <menu.icon className="h-5 w-5 shrink-0" />
                  <span className="text-[11px] font-medium leading-tight break-words whitespace-normal">
                    {menu.name}
                  </span>
                </button>
              </Link>
            )
          })}
        </div>
      </div>


      {/* Main content */}
      <div className="w-full">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between p-2 border-b bg-card">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold text-primary m-auto">{process.env.BUSINESS_NAME}</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="p-4 min-h-screen overflow-y-auto mb-[72px]">{children}</main>
      </div>
    </div>
  )
}
