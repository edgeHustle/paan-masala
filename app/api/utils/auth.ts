import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import type { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"

export interface User {
  _id: string
  username: string
  role: "admin" | "user"
  name: string
}

export interface Customer {
  _id: string;
  serialNumber: number;
  name: string;
  mobile: string;
  type: string;
}

export function generateToken(payload: User | Customer, type: "staff" | "customer"): string {
  return jwt.sign({ ...payload, type }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): ((User | Customer) & { type: "staff" | "customer" }) | null {
  try {
    return jwt.verify(token, JWT_SECRET) as (User | Customer) & { type: "staff" | "customer" }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  return request.cookies.get("token")?.value || null
}

export function getUserFromRequest(request: NextRequest): ((User | Customer) & { type: "staff" | "customer" }) | null {
  const token = getTokenFromRequest(request)
  if (!token) {
    return null
  }

  return verifyToken(token)
}

export function requireAuth(request: NextRequest, requiredType?: "staff" | "customer") {
  const token = getTokenFromRequest(request)
  if (!token) {
    throw new Error("Authentication required")
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    throw new Error("Invalid token")
  }

  if (requiredType && decoded.type !== requiredType) {
    throw new Error("Insufficient permissions")
  }

  return decoded
}
