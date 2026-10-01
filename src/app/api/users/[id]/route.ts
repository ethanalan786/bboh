import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting the current user
    if (user.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete the user
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
