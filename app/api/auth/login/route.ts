import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/app/api/utils/mongodb"
import { comparePassword, generateToken } from "@/app/api/utils/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ username })
    console.log(">>>>>>>>>", user, username, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValidPassword = await comparePassword(password, user.password)
    console.log(">>>>>>>>> in valid password", isValidPassword);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    const token = generateToken(
      {
        _id: user._id.toString(),
        username: user.username,
        role: user.role,
        name: user.name,
      },
      "staff",
    )

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
