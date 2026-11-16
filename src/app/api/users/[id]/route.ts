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
      where: { id },
      include: {
        _count: {
          select: {
            stockHistory: true,
            sales: true,
            customerSales: true,
            auditLogs: true,
            reportBookmarks: true,
            feedback: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting the current user
    if (user.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const activityCount =
      user._count.stockHistory +
      user._count.sales +
      user._count.customerSales +
      user._count.auditLogs +
      user._count.reportBookmarks +
      user._count.feedback

    // Users with activity can't be hard-deleted without destroying sales,
    // stock, and audit history — deactivate them instead.
    if (activityCount > 0) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      })

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: 'User has activity records and was deactivated instead of deleted.'
      })
    }

    // No related records — safe to delete permanently
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, deactivated: false, message: 'User deleted successfully' })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
