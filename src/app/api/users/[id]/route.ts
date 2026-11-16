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
    const body = await request.json().catch(() => ({}))
    const { action, confirmEmail } = body as { action?: string; confirmEmail?: string }

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

    if (activityCount === 0) {
      // No related records — safe to delete permanently
      await prisma.user.delete({
        where: { id }
      })

      return NextResponse.json({ success: true, purged: false, message: 'User deleted successfully' })
    }

    // Users with activity: either deactivate (keep history) or purge everything.
    if (action === 'purge') {
      // Extra verification — admin must type the user's email to confirm
      if (!confirmEmail || confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Confirmation email does not match this user' },
          { status: 400 }
        )
      }

      // Detach the user from sales where they were the customer
      await prisma.sale.updateMany({
        where: { customerId: id },
        data: { customerId: null }
      })

      // Delete every record related to the user
      await prisma.stockHistory.deleteMany({ where: { userId: id } })
      await prisma.sale.deleteMany({ where: { userId: id } })
      await prisma.auditLog.deleteMany({ where: { userId: id } })
      await prisma.reportBookmark.deleteMany({ where: { userId: id } })
      await prisma.feedback.deleteMany({ where: { userId: id } })
      await prisma.user.delete({ where: { id } })

      return NextResponse.json({
        success: true,
        purged: true,
        message: 'User and all related data permanently deleted.'
      })
    }

    // Default: deactivate — blocks login, preserves all history
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      deactivated: true,
      activityCount,
      message: 'User has activity records and was deactivated instead of deleted.'
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
