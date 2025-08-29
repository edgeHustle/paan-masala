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
  const [active, setActive] = useState("Dashboard");

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

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-lg font-semibold text-primary">Pan Masala Store</h1>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 hidden">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => setSidebarOpen(false)}
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

      <div className="fixed bottom-0 left-1/2 min-w-screen -translate-x-1/2  bg-slate-100 rounded-lg px-2 pt-0 pb-4 flex justify-around gap-2 shadow-[0px_-4px_6px_0px_rgba(0,0,0,0.1)] z-100 shadow-top">
        {navigation.map((menu) => (
          <button
            key={menu.id}
            onClick={() => setActive(menu.id)}
            className={`relative flex items-center justify-center w-[50px]  px-2 py-1",
              ${active === menu.id
                ? "border-primary border-t-4 px-2 py-1 text-primary"
                : "bg-slate-100  text-gray-500 border-slate-100 border-t-4 px-2 py-1"}
            `}
          >
            <Link
              href={menu.href}
              className={`flex flex-col  items-center justify-around transition-all duration-100 ease-in-out gap-2",
                ${active === menu.id ? "opacity-100" : "opacity-100"}
              `}
            >
              <span className={`mr-1 transition-all duration-300 ease-in-out ${active === menu.id ? "opacity-100 text-primary" : "text-gray-500"}`}><menu.icon /></span>
              <span className="whitespace-nowrap font-regular text-xs">
                {menu.name}
              </span>
              {/* {active === menu.id && (
              )} */}
            </Link>
          </button>
        ))}
      </div>
      {/* Main content */}
      <div className="w-full">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between p-2 border-b bg-card">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold text-primary m-auto">Pan Masala Store</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6 h-[calc(100vh-56px)] lg:h-screen overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
