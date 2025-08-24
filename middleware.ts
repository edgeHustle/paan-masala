import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/customer-login"]

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Get token from cookie or Authorization header
  const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    // return NextResponse.redirect(new URL("/login", request.url))
  }

  // Route protection based on user type
  // if (pathname.startsWith("/customer-portal") && decoded.type !== "customer") {
  //   return NextResponse.redirect(new URL("/customer-login", request.url))
  // }

  // if (!pathname.startsWith("/customer-portal") && !pathname.startsWith("/customer-login") && decoded.type !== "staff") {
  //   return NextResponse.redirect(new URL("/login", request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon-.*\\.png|manifest.json|sw.js).*)"],
}
