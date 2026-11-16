import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Returns a breakdown of everything tied to a user, for the delete/deactivate dialog.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const [
      sales,
      burnBoxSales,
      stockHistory,
      auditLogs,
      reportBookmarks,
      feedback,
      customerSales,
    ] = await Promise.all([
      prisma.sale.count({ where: { userId: id } }),
      prisma.burnBoxSale.count({ where: { userId: id } }),
      prisma.stockHistory.count({ where: { userId: id } }),
      prisma.auditLog.count({ where: { userId: id } }),
      prisma.reportBookmark.count({ where: { userId: id } }),
      prisma.feedback.count({ where: { userId: id } }),
      prisma.sale.count({ where: { customerId: id } }),
    ])

    return NextResponse.json({
      activity: {
        sales,
        burnBoxSales,
        stockHistory,
        auditLogs,
        reportBookmarks,
        feedback,
        customerSales,
      }
    })
  } catch (error) {
    console.error("Error fetching user activity:", error)
    return NextResponse.json(
      { error: "Failed to fetch user activity", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
