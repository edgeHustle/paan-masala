"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Store, Users, Calculator } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    const userType = localStorage.getItem("userType")

    if (token && userType === "staff") {
      router.push("/dashboard")
    } else if (token && userType === "customer") {
      router.push("/customer-portal")
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-emerald-600 p-3 rounded-full">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-emerald-900">Pan Masala Store</h1>
          <p className="text-emerald-700">Complete Business Management Solution</p>
        </div>

        <div className="space-y-4">
          <Card className="border-emerald-200 hover:border-emerald-300 transition-colors">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-2">
                <Calculator className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-emerald-900">Staff Login</CardTitle>
              <CardDescription>Access admin panel and manage business</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/login")} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Login as Staff
              </Button>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 hover:border-emerald-300 transition-colors">
            <CardHeader className="text-center pb-3">
              <div className="flex justify-center mb-2">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-emerald-900">Customer Portal</CardTitle>
              <CardDescription>View your account and transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/customer-login")}
                variant="outline"
                className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                Customer Login
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-emerald-600">
          <p>© 2024 Pan Masala Store. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
