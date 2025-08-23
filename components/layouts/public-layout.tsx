import type React from "react"

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">{children}</div>
}
