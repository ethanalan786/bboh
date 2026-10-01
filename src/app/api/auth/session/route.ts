import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ 
      user: {
        id: (session.user as any).id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role,
      }
    })
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json({ user: null })
  }
}