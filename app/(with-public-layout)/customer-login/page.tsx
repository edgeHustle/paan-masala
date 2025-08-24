"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Phone, EyeOff, Eye } from "lucide-react"

export default function CustomerLogin() {
  const [serialNumber, setSerialNumber] = useState("");
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serialNumber.trim()) {
      setError("Please enter your serial number")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/customer-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumber: serialNumber.trim(), password: password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/customer-portal")
      } else {
        setError(data.error || "Invalid serial number")
      }
    } catch (error) {
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Customer Portal</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Enter your serial number to view your account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serialNumber" className="text-sm font-medium text-gray-700">
                Serial Number
              </Label>
              <Input
                id="serialNumber"
                type="text"
                placeholder="Enter your serial number (e.g., 123)"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="h-12 text-lg font-mono"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-lg font-mono pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-emerald-600" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Access My Account"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Need help?</p>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => window.open("https://wa.me/1234567890", "_blank")}
              >
                <Phone className="w-4 h-4 mr-2" />
                Contact on WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
